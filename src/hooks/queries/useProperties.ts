import {
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  Property,
  PropertyCreate,
  PropertyCursorPage,
  PropertyUpdate,
  PropertyImageUploadPayload,
  PropertyImageUploadResponse,
  BoostListingPayload,
  BoostListingResponse,
  RenewListingPayload
} from "@/lib/api/types";

const MY_PROPERTIES_PAGE_SIZE = 20;

export const myPropertiesOptions = queryOptions({
  queryKey: ["properties", "mine"],
  queryFn: async () => {
    const response = await apiClient.request<PropertyCursorPage>({
      method: "GET",
      path: "/properties/me"
    });
    // Defense-in-depth against envelope shape drift (see RCA for the
    // notifications `h?.filter is not a function` regression).
    return Array.isArray(response?.items) ? response.items : [];
  }
});

/**
 * Infinite cursor-paginated "my properties" list.
 *
 * The backend `/properties/me` endpoint returns a `CursorPage<Property>` envelope.
 * Pages are concatenated in order; consumers can either flatten the pages or
 * use the raw `InfiniteData` for virtualized rendering.
 */
export function useInfiniteMyProperties() {
  return useInfiniteQuery({
    queryKey: ["properties", "mine", "infinite"],
    queryFn: async ({ pageParam, signal }) => {
      const response = await apiClient.request<PropertyCursorPage>({
        method: "GET",
        path: "/properties/me",
        query: { cursor: pageParam, limit: MY_PROPERTIES_PAGE_SIZE },
        signal
      });
      return response;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined
  });
}

export function propertyOptions(id: number) {
  return queryOptions({
    queryKey: ["properties", id],
    queryFn: () =>
      apiClient.request<Property>({
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
      apiClient.request<Property>({
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
      apiClient.request<Property>({
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

interface UpdateContext {
  previousSingle: Property | undefined;
  previousList: Property[] | undefined;
}

export function useUpdateProperty(id: number) {
  const queryClient = useQueryClient();

  return useMutation<Property, Error, PropertyUpdate, UpdateContext>({
    mutationFn: (payload) =>
      apiClient.request<Property>({
        method: "PUT",
        path: `/properties/${id}`,
        body: payload
      }),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["properties", id] });
      await queryClient.cancelQueries({ queryKey: ["properties", "mine"] });

      const previousSingle = queryClient.getQueryData<Property>(["properties", id]);
      const previousList = queryClient.getQueryData<Property[]>(["properties", "mine"]);

      if (previousSingle) {
        queryClient.setQueryData<Property>(["properties", id], {
          ...previousSingle,
          ...payload
        });
      }

      if (previousList) {
        queryClient.setQueryData<Property[]>(
          ["properties", "mine"],
          previousList.map((p) => (p.id === id ? { ...p, ...payload } : p))
        );
      }

      return { previousSingle, previousList };
    },

    onError: (_err, _payload, context) => {
      if (context?.previousSingle !== undefined) {
        queryClient.setQueryData(["properties", id], context.previousSingle);
      }
      if (context?.previousList !== undefined) {
        queryClient.setQueryData(["properties", "mine"], context.previousList);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties", id] });
      queryClient.invalidateQueries({ queryKey: ["properties", id, "mine"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

interface DeleteContext {
  previousList: Property[] | undefined;
}

export function useDeleteProperty(id: number) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, void, DeleteContext>({
    mutationFn: () =>
      apiClient.request<{ message: string }>({
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.removeQueries({ queryKey: ["properties", id] });
      queryClient.removeQueries({ queryKey: ["properties", id, "mine"] });
    }
  });
}

export function useUploadPropertyImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      payload
    }: {
      propertyId: number;
      payload: PropertyImageUploadPayload;
    }) =>
      apiClient.request<PropertyImageUploadResponse>({
        method: "POST",
        path: `/properties/${propertyId}/images`,
        body: payload
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["properties", variables.propertyId]
      });
      queryClient.invalidateQueries({
        queryKey: ["properties", variables.propertyId, "mine"]
      });
      queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useBoostListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      payload
    }: {
      propertyId: number;
      payload: BoostListingPayload;
    }) =>
      apiClient.request<BoostListingResponse>({
        method: "POST",
        path: `/properties/${propertyId}/boost`,
        body: payload
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["properties", variables.propertyId]
      });
      queryClient.invalidateQueries({
        queryKey: ["properties", variables.propertyId, "mine"]
      });
      queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useRenewListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      payload
    }: {
      propertyId: number;
      payload: RenewListingPayload;
    }) =>
      apiClient.request<Property>({
        method: "POST",
        path: `/properties/${propertyId}/renew`,
        body: payload
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["properties", variables.propertyId]
      });
      queryClient.invalidateQueries({
        queryKey: ["properties", variables.propertyId, "mine"]
      });
      queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}
