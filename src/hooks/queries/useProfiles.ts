import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  FlatmatesPeer,
  FlatmatesProfile,
  FlatmatesProfileUpdate,
  PeerFilters,
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

export const myProfileOptions = queryOptions({
  queryKey: ["profile", "me"],
  queryFn: () =>
    apiClient.request<FlatmatesProfile>({
      method: "GET",
      path: "/flatmates/profile"
    })
});

export function profileOptions(id: number) {
  return queryOptions({
    queryKey: ["profiles", id],
    queryFn: () =>
      apiClient.request<FlatmatesProfile>({
        method: "GET",
        path: `/flatmates/profiles/${id}`
      }),
    enabled: id > 0
  });
}

export function peerProfilesOptions(filters?: PeerFilters) {
  return queryOptions({
    queryKey: ["profiles", "peers", filters],
    queryFn: () =>
      apiClient.request<FlatmatesPeer[]>({
        method: "GET",
        path: "/flatmates/profiles",
        query: (filters ?? {}) as Record<string, QueryValue>
      })
  });
}

export function useMyProfile() {
  return useQuery(myProfileOptions);
}

export function useProfile(id: number) {
  return useQuery(profileOptions(id));
}

export function usePeers(filters?: PeerFilters) {
  return useQuery(peerProfilesOptions(filters));
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FlatmatesProfileUpdate) =>
      apiClient.request<FlatmatesProfile>({
        method: "PATCH",
        path: "/flatmates/profile",
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    }
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FlatmatesProfileUpdate) =>
      apiClient.request<FlatmatesProfile>({
        method: "POST",
        path: "/flatmates/profile",
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    }
  });
}
