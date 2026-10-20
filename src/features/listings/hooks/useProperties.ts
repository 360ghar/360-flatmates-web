import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { fetchAllPages, MAX_PAGE_LIMIT } from "@/lib/api/pagination";
import type {
  OwnerListingStatus,
  Property,
  PropertyCreate,
  PropertyCursorPage,
  PropertyDetail,
  PropertyUpdate
} from "@/lib/api/types";

/** Every listing of the signed-in owner. `GET /properties/me` pages 100 at a time. */
export const myPropertiesOptions = queryOptions({
  queryKey: ["properties", "mine"],
  queryFn: ({ signal }) =>
    fetchAllPages<Property>((cursor) =>
      apiClient.request<PropertyCursorPage>({
        method: "GET",
        path: "/properties/me",
        query: { cursor, limit: MAX_PAGE_LIMIT },
        signal
      })
    )
});

export function propertyOptions(id: number) {
  return queryOptions({
    queryKey: ["properties", id],
    queryFn: () =>
      apiClient.request<PropertyDetail>({
        method: "GET",
        path: `/properties/${id}`
      }),
    enabled: id > 0
  });
}

export function useProperty(id: number) {
  return useQuery(propertyOptions(id));
}

export function myPropertyOptions(id: number) {
  return queryOptions({
    queryKey: ["properties", id, "mine"],
    queryFn: ({ signal }) =>
      apiClient.request<PropertyDetail>({
        method: "GET",
        path: `/properties/${id}`,
        signal
      }),
    enabled: id > 0
  });
}

export function useMyProperty(id: number) {
  return useQuery(myPropertyOptions(id));
}

export function adminPropertyOptions(id: number) {
  return queryOptions({
    queryKey: ["properties", id, "admin"],
    queryFn: ({ signal }) =>
      apiClient.request<PropertyDetail>({
        method: "GET",
        path: `/properties/${id}`,
        signal
      }),
    enabled: id > 0
  });
}

export function useAdminProperty(id: number) {
  return useQuery(adminPropertyOptions(id));
}

export function useMyProperties() {
  return useQuery(myPropertiesOptions);
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PropertyCreate) =>
      apiClient.request<Property>({
        method: "POST",
        path: "/properties",
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
    }
  });
}

function invalidateListing(queryClient: ReturnType<typeof useQueryClient>, id: number) {
  queryClient.invalidateQueries({ queryKey: ["properties", id] });
  queryClient.invalidateQueries({ queryKey: ["properties", id, "mine"] });
  queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
}

/**
 * Edit a listing's content. Send only the keys that changed. A content edit
 * sends a live flatmate or PG listing back to review, so the server state
 * differs from the form values: read the response, do not merge the payload.
 */
export function useUpdateProperty(id: number) {
  const queryClient = useQueryClient();

  return useMutation<Property, Error, PropertyUpdate>({
    mutationFn: (payload) =>
      apiClient.request<Property>({
        method: "PUT",
        path: `/properties/${id}`,
        body: payload
      }),
    onSuccess: () => invalidateListing(queryClient, id)
  });
}

/**
 * The owner's own availability action: pause a live listing or resume a paused
 * one. It is separate from content edits. The server answers 409
 * `LISTING_STATUS_CONFLICT` when the listing is in review or was rejected.
 */
export function useSetListingStatus(id: number) {
  const queryClient = useQueryClient();

  return useMutation<Property, Error, OwnerListingStatus>({
    mutationFn: (status) =>
      apiClient.request<Property>({
        method: "PUT",
        path: `/properties/${id}`,
        body: { listing_preferences: { moderation_status: status } }
      }),
    onSuccess: () => invalidateListing(queryClient, id)
  });
}

interface DeleteContext {
  previousList: Property[] | undefined;
}

export function useDeleteProperty(id: number) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void, DeleteContext>({
    // 204, no body.
    mutationFn: () =>
      apiClient.request<void>({
        method: "DELETE",
        path: `/properties/${id}`
      }),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["properties", "mine"] });

      const previousList = queryClient.getQueryData<Property[]>(["properties", "mine"]);

      if (previousList) {
        queryClient.setQueryData<Property[]>(
          ["properties", "mine"],
          previousList.filter((p) => p.id !== id)
        );
      }

      return { previousList };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousList !== undefined) {
        queryClient.setQueryData(["properties", "mine"], context.previousList);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
      queryClient.removeQueries({ queryKey: ["properties", id] });
      queryClient.removeQueries({ queryKey: ["properties", id, "mine"] });
    }
  });
}
