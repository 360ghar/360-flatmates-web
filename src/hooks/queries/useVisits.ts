import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { uiStore } from "@/lib/stores/ui-store";
import type {
  Visit,
  VisitCursorPage,
  VisitCreate,
  VisitUpdate,
  VisitCancel,
  VisitFilters
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
 * Returns true if the API would accept a status change from `from` to `to`.
 * Mirrors the server-side state machine so the client can short-circuit
 * obviously invalid transitions. The server still enforces; this guard
 * exists only to prevent wasted requests and confusing toasts.
 */
export function canTransitionVisitStatus(
  from: Visit["status"] | undefined,
  to: Visit["status"]
): boolean {
  if (from === to) return false;
  if (!from) return false;

  switch (from) {
    case "requested":
      return to === "confirmed" || to === "cancelled" || to === "reschedule_suggested";
    case "confirmed":
      return to === "completed" || to === "cancelled";
    case "reschedule_suggested":
      return to === "confirmed" || to === "cancelled";
    case "completed":
    case "cancelled":
      return false;
  }
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
        const existing =
          queryClient.getQueryData<Visit[]>(["visits", undefined]) ??
          queryClient.getQueryData<Visit[]>(["visits", {}]);
        const conflict = existing?.find((visit) => {
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

export function useUpdateVisit(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VisitUpdate) => {
      // Guard against bad IDs (mirrors `useVisit`).
      if (!Number.isFinite(id) || id <= 0) {
        return Promise.reject(new Error("Invalid visit id"));
      }

      const current = queryClient.getQueryData<Visit>(["visits", id]);
      
      // Client-side status transition guard. Only enforced when the payload
      // includes a status change; non-status updates (date, notes, feedback)
      // are still allowed regardless of current state.
      if (payload.status !== undefined) {
        if (!canTransitionVisitStatus(current?.status, payload.status)) {
          return Promise.reject(
            new Error(
              `Invalid visit status transition: ${current?.status ?? "unknown"} → ${payload.status}`
            )
          );
        }
      }

      const isFlatmateMeet = current?.visit_context === "flatmate_meet";

      return apiClient.request<any>({
        method: "PUT",
        path: isFlatmateMeet ? `/flatmates/visits/${id}` : `/visits/${id}`,
        body: payload
      }).then((res) => ({ isFlatmateMeet, res }));
    },
    onSuccess: ({ isFlatmateMeet, res }) => {
      // Seed the detail cache with the server response, then invalidate the
      // whole "visits" namespace so the list and calendar reflect the new
      // status/date as well as the detail view.
      if (!isFlatmateMeet) {
        queryClient.setQueryData(["visits", id], res);
      }
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    }
  });
}

export function useCancelVisit(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: VisitCancel) => {
      if (!Number.isFinite(id) || id <= 0) {
        return Promise.reject(new Error("Invalid visit id"));
      }
      return apiClient.request<Visit>({
        method: "POST",
        path: `/visits/${id}/cancel`,
        body: payload ?? {}
      });
    },
    onSuccess: (cancelled) => {
      queryClient.setQueryData(["visits", id], cancelled);
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    }
  });
}
