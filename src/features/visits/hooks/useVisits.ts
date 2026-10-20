import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { uiStore } from "@/lib/stores/ui-store";
import type {
  FlatmateVisitUpdate,
  Visit,
  VisitCursorPage,
  VisitCreate,
  VisitUpdate,
  VisitCancel,
  VisitFilters,
  VisitReschedule
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

export function useVisits(filters?: VisitFilters) {
  return useQuery({
    queryKey: ["visits", filters],
    queryFn: async ({ signal }) => {
      const response = await apiClient.request<VisitCursorPage>({
        method: "GET",
        path: "/visits",
        query: (filters ?? {}) as Record<string, QueryValue>,
        signal
      });
      // Defense-in-depth against envelope shape drift (see RCA for the
      // notifications `h?.filter is not a function` regression).
      return Array.isArray(response?.items) ? response.items : [];
    }
  });
}

const VISITS_PAGE_SIZE = 20;

/**
 * Infinite cursor-paginated visits query.
 *
 * The backend `/visits` endpoint now returns a `CursorPage<Visit>` envelope.
 * `cursor` and `limit` are sent as query params; the next page is fetched
 * while `has_more` is true and `next_cursor` is non-null.
 */
export function useInfiniteVisits(filters?: Omit<VisitFilters, "limit" | "cursor">) {
  return useInfiniteQuery({
    queryKey: ["visits", "infinite", filters],
    queryFn: async ({ pageParam, signal }) => {
      const response = await apiClient.request<VisitCursorPage>({
        method: "GET",
        path: "/visits",
        query: {
          ...(filters ?? {}),
          cursor: pageParam,
          limit: VISITS_PAGE_SIZE
        } as Record<string, QueryValue>,
        signal
      });
      return response;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined
  });
}

export function useVisit(id: number) {
  return useQuery({
    queryKey: ["visits", id],
    queryFn: ({ signal }) =>
      apiClient.request<Visit>({
        method: "GET",
        path: `/visits/${id}`,
        signal
      }),
    enabled: Number.isFinite(id) && id > 0
  });
}

/**
 * Returns true if `PUT /visits/{id}` would accept a status change from `from`
 * to `to`. The route takes `status: "confirmed"` and nothing else: a cancel, a
 * reschedule and a completion each have their own route (any other status is a
 * 422). The server still enforces this; the guard only saves a wasted request.
 */
export function canTransitionVisitStatus(
  from: Visit["status"] | undefined,
  to: Visit["status"]
): boolean {
  return to === "confirmed" && (from === "requested" || from === "reschedule_suggested");
}

/** Extract the local YYYY-MM-DD key from a `scheduled_date` string. */
function localDayKey(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VisitCreate) => {
      // Client-side schedule conflict check (warning only — do not block).
      // The server is the source of truth; this just nudges users away from
      // double-booking the same day for the same property.
      const dayKey = localDayKey(payload.scheduled_date);
      if (dayKey) {
        // The visits list is the infinite query, so its cached pages hold the visits to check.
        const existing = queryClient
          .getQueriesData<InfiniteData<VisitCursorPage>>({ queryKey: ["visits", "infinite"] })
          .flatMap(([, data]) => data?.pages.flatMap((page) => page.items) ?? []);
        const conflict = existing.find((visit) => {
          if (visit.property_id !== payload.property_id) return false;
          if (visit.status === "cancelled" || visit.status === "completed") return false;
          return localDayKey(visit.scheduled_date) === dayKey;
        });
        if (conflict) {
          uiStore.getState().pushToast({
            type: "warning",
            title: "You already have a visit on this day",
            description: "Check the Visits tab to avoid a double-booking.",
          });
        }
      }

      return apiClient.request<Visit>({
        method: "POST",
        path: "/visits",
        body: payload
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    }
  });
}

type UpdateVisitResult =
  | { kind: "property_tour"; visit: Visit }
  | { kind: "flatmate_meet" };

/**
 * Change a visit: confirm it (`status: "confirmed"`), or save notes, feedback and
 * follow-up. A reschedule has its own route ({@link useRescheduleVisit}) and so
 * does a cancel ({@link useCancelVisit}): `PUT /visits/{id}` rejects both.
 */
export function useUpdateVisit(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: VisitUpdate): Promise<UpdateVisitResult> => {
      let payload = update;
      // Guard against bad IDs (mirrors `useVisit`).
      if (!Number.isFinite(id) || id <= 0) {
        return Promise.reject(new Error("Invalid visit id"));
      }

      // Prefer detail cache; on cold cache fetch once so we route by visit_context
      // correctly (a flatmate meet confirms through its own route).
      let current = queryClient.getQueryData<Visit>(["visits", id]);
      if (!current) {
        current = await apiClient.request<Visit>({
          method: "GET",
          path: `/visits/${id}`
        });
        queryClient.setQueryData(["visits", id], current);
      }

      // Client-side status transition guard. Only enforced when the payload
      // includes a status change; non-status updates (notes, feedback)
      // are still allowed regardless of current state.
      if (payload.status != null) {
        if (!canTransitionVisitStatus(current.status, payload.status)) {
          return Promise.reject(
            new Error(
              `Invalid visit status transition: ${current.status} → ${payload.status}`
            )
          );
        }
      }

      // A flatmate meet changes status through a scoped endpoint that also pushes
      // a realtime update to both people. That route takes only `status` and
      // `scheduled_date` and returns `{ id, status }`, not a Visit: never seed the
      // detail cache with it. Notes and feedback still go to `PUT /visits/{id}`,
      // which lets either person of a meet update it.
      if (current.visit_context === "flatmate_meet" && payload.status != null) {
        const { status, ...rest } = payload;
        const body: FlatmateVisitUpdate = { status };
        await apiClient.request({
          method: "PUT",
          path: `/flatmates/visits/${id}`,
          body
        });
        if (Object.keys(rest).length === 0) return { kind: "flatmate_meet" };
        payload = rest;
      }

      const visit = await apiClient.request<Visit>({
        method: "PUT",
        path: `/visits/${id}`,
        body: payload
      });
      return { kind: "property_tour", visit };
    },
    onSuccess: (result) => {
      // Seed the detail cache only for full Visit responses, then invalidate
      // the whole "visits" namespace so list/calendar/detail stay consistent.
      if (result.kind === "property_tour") {
        queryClient.setQueryData(["visits", id], result.visit);
      }
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    }
  });
}

/** `POST /visits/{id}/reschedule`. `new_date` is an ISO time with a UTC offset. */
export function useRescheduleVisit(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VisitReschedule) => {
      if (!Number.isFinite(id) || id <= 0) {
        return Promise.reject(new Error("Invalid visit id"));
      }
      return apiClient.request<Visit>({
        method: "POST",
        path: `/visits/${id}/reschedule`,
        body: payload
      });
    },
    onSuccess: (visit) => {
      queryClient.setQueryData(["visits", id], visit);
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    }
  });
}

/** `POST /visits/{id}/cancel`. The reason is required (1 to 1000 characters). */
export function useCancelVisit(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VisitCancel) => {
      if (!Number.isFinite(id) || id <= 0) {
        return Promise.reject(new Error("Invalid visit id"));
      }
      return apiClient.request<Visit>({
        method: "POST",
        path: `/visits/${id}/cancel`,
        body: { reason: payload.reason.trim() }
      });
    },
    onSuccess: (cancelled) => {
      queryClient.setQueryData(["visits", id], cancelled);
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    }
  });
}
