import type { UserMode } from "@/components/ui/Badge";

export type ChatReportReason = "spam" | "fake_profile" | "abuse" | "inappropriate" | "other";

export interface ChatThreadParticipant {
  name: string;
  avatarUrl?: string | null;
  mode?: UserMode;
  verified?: boolean;
  compatibilityScore?: number;
}
