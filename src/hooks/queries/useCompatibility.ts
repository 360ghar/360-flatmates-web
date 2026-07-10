import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { CompatibilityBreakdown } from "@/lib/api/types";

export function useCompatibility(peerId: number) {
  return useQuery({
    queryKey: ["compatibility", peerId],
    queryFn: async (): Promise<CompatibilityBreakdown> => {
      const response = await apiClient.request<CompatibilityBreakdown>({
        method: "GET",
        path: `/flatmates/profiles/${peerId}/compatibility`
      });
      return response;
    },
    enabled: peerId > 0,
    staleTime: 5 * 60 * 1000,
    retry: false
  });
}
