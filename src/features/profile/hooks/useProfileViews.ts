import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ProfileViewEventCreate, ProfileViewEventOut } from "@/lib/api/types";

export function useRecordProfileView() {
  return useMutation({
    mutationFn: (payload: ProfileViewEventCreate) =>
      apiClient.request<ProfileViewEventOut>({
        method: "POST",
        path: "/flatmates/profile-views",
        body: payload
      })
  });
}
