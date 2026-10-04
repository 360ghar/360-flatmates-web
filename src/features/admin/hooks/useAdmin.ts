import { useMutation, useQueryClient, useInfiniteQuery, keepPreviousData, type InfiniteData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  AdminListingCursorPage,
  AdminReportCursorPage,
  AdminListingFilters,
  AdminReportFilters,
  FlatmateListingAdmin,
  ListingModerationPayload,
  ReportActionPayload,
  ReportAdmin
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

const ADMIN_PAGE_LIMIT = 20;

function isArrayOfListings(value: unknown): value is FlatmateListingAdmin[] {
  return Array.isArray(value) && value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "title" in item &&
      "moderation_status" in item
  );
}

function isInfiniteListingsData(
  value: unknown
): value is InfiniteData<AdminListingCursorPage> {
  return (
    typeof value === "object" &&
    value !== null &&
    "pages" in value &&
    Array.isArray((value as { pages: unknown }).pages) &&
    (value as { pages: unknown[] }).pages.every(
      (page) =>
        typeof page === "object" &&
        page !== null &&
        "items" in page &&
        Array.isArray((page as { items: unknown }).items)
    )
  );
}

function isArrayOfReports(value: unknown): value is ReportAdmin[] {
  return Array.isArray(value) && value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "reason" in item &&
      "status" in item
  );
}

function isInfiniteReportsData(
  value: unknown
): value is InfiniteData<AdminReportCursorPage> {
  return (
    typeof value === "object" &&
    value !== null &&
    "pages" in value &&
    Array.isArray((value as { pages: unknown }).pages) &&
    (value as { pages: unknown[] }).pages.every(
      (page) =>
        typeof page === "object" &&
        page !== null &&
        "items" in page &&
        Array.isArray((page as { items: unknown }).items)
    )
  );
}

export function useAdminModerate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listingId,
      payload
    }: {
      listingId: number;
      payload: ListingModerationPayload;
    }) =>
      apiClient.request<{ listing_id: number; action: string; status: string; reason?: string }>({
        method: "PUT",
        path: `/flatmates/moderation/listings/${listingId}`,
        body: payload
      }),
    // Optimistically remove the moderated listing from any cached queue so the
    // queue does not flash the just-actioned row while the refetch is in flight.
    onMutate: async ({ listingId }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "listings"] });
      const snapshots = queryClient.getQueriesData<unknown>({
        queryKey: ["admin", "listings"]
      });
      for (const [key, value] of snapshots) {
        if (isArrayOfListings(value)) {
          queryClient.setQueryData<FlatmateListingAdmin[]>(
            key,
            value.filter((l) => l.id !== listingId)
          );
        } else if (isInfiniteListingsData(value)) {
          queryClient.setQueryData<InfiniteData<AdminListingCursorPage>>(key, {
            ...value,
            pages: value.pages.map((page) => ({
              ...page,
              items: page.items.filter((l) => l.id !== listingId),
              total: page.total != null ? Math.max(0, page.total - 1) : page.total
            }))
          });
        }
      }
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      context?.snapshots.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
    }
  });
}

export function useInfiniteAdminListings(
  filters?: Omit<AdminListingFilters, "limit" | "cursor">
) {
  return useInfiniteQuery({
    queryKey: ["admin", "listings", "infinite", filters],
    queryFn: ({ signal, pageParam }) =>
      apiClient.request<AdminListingCursorPage>({
        method: "GET",
        path: "/flatmates/moderation/listings",
        query: {
          ...(filters ?? {}),
          limit: ADMIN_PAGE_LIMIT,
          cursor: pageParam
        } as Record<string, QueryValue>,
        signal
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000
  });
}

export function useInfiniteAdminReports(
  filters?: Omit<AdminReportFilters, "limit" | "cursor">
) {
  return useInfiniteQuery({
    queryKey: ["admin", "reports", "infinite", filters],
    queryFn: ({ signal, pageParam }) =>
      apiClient.request<AdminReportCursorPage>({
        method: "GET",
        path: "/flatmates/moderation/reports",
        query: {
          ...(filters ?? {}),
          limit: ADMIN_PAGE_LIMIT,
          cursor: pageParam
        } as Record<string, QueryValue>,
        signal
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000
  });
}

export function useAdminReportAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      payload
    }: {
      reportId: number;
      payload: ReportActionPayload;
    }) =>
      apiClient.request<{ report_id: number; action: string; status: string }>({
        method: "PUT",
        path: `/flatmates/moderation/reports/${reportId}`,
        body: payload
      }),
    // Optimistically drop the actioned report from the open queue.
    onMutate: async ({ reportId }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "reports"] });
      const snapshots = queryClient.getQueriesData<unknown>({
        queryKey: ["admin", "reports"]
      });
      for (const [key, value] of snapshots) {
        if (isArrayOfReports(value)) {
          queryClient.setQueryData<ReportAdmin[]>(
            key,
            value.filter((r) => r.id !== reportId)
          );
        } else if (isInfiniteReportsData(value)) {
          queryClient.setQueryData<InfiniteData<AdminReportCursorPage>>(key, {
            ...value,
            pages: value.pages.map((page) => ({
              ...page,
              items: page.items.filter((r) => r.id !== reportId),
              total: page.total != null ? Math.max(0, page.total - 1) : page.total
            }))
          });
        }
      }
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      context?.snapshots.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    }
  });
}
