import type { FlatmateAdminUser } from "./admin.types";

/** Name of a user in a moderation row. The row embeds the user, or only its id. */
export function adminUserName(user: Pick<FlatmateAdminUser, "full_name"> | null | undefined, userId: number): string {
  return user?.full_name?.trim() || `User #${userId}`;
}
