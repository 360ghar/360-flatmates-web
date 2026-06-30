import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { BugReportCreate, BugReportOut, ReportCreate, ReportOut } from "@/lib/api/types";

export function useReportUserMutation() {
  return useMutation({
    mutationFn: (payload: ReportCreate) =>
      apiClient.request<ReportOut>({
        method: "POST",
        path: "/flatmates/reports",
        body: payload
      })
  });
}

export function useSubmitBugReportMutation() {
  return useMutation({
    mutationFn: (payload: BugReportCreate) =>
      apiClient.request<BugReportOut>({
        method: "POST",
        path: "/bugs",
        body: payload
      })
  });
}
