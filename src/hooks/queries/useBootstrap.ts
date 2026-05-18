import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { FlatmatesBootstrap } from "@/lib/api/types";

export const bootstrapOptions = queryOptions({
  queryKey: ["bootstrap"],
  queryFn: () =>
    apiClient.request<FlatmatesBootstrap>({
      method: "GET",
      path: "/flatmates/bootstrap"
    }),
  staleTime: 5 * 60 * 1000
});

export function useBootstrap() {
  return useQuery(bootstrapOptions);
}
