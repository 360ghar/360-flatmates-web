import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useBlockedUsers, useUnblockUser } from "@/hooks/queries";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AsyncView } from "@/components/ui/StateViews";

export function BlockedUsersPage() {
  const navigate = useNavigate();
  const { data: blockedUsers, isLoading, error, refetch } = useBlockedUsers();
  const unblockUser = useUnblockUser();
  const [pendingId, setPendingId] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button variant="icon" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Blocked Users</h1>
      </div>

      <AsyncView
        data={blockedUsers ?? []}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        loading={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div aria-hidden="true" className="h-[34px] w-[34px] shrink-0 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div aria-hidden="true" className="h-4 w-24 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
                    <div aria-hidden="true" className="h-3 w-16 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
                  </div>
                </div>
                <div aria-hidden="true" className="h-8 w-20 shrink-0 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        }
        empty={
          <p className="py-8 text-center text-body-md text-ink-3">
            No blocked users. You can block someone from their profile or conversation.
          </p>
        }
        onRetry={() => refetch()}
      >
        {(data) => (
          <div className="flex flex-col gap-3">
            {data.map((block) => (
              <Card key={block.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={block.blocked_user.full_name}
                    src={block.blocked_user.profile_image_url}
                    size="compact"
                    shape="circle"
                  />
                  <div className="min-w-0">
                    <p className="text-body-md font-semibold text-ink truncate">
                      {block.blocked_user.full_name}
                    </p>
                    {block.blocked_user.locality && (
                      <p className="text-caption text-ink-3 truncate">
                        {block.blocked_user.locality}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="tertiary"
                  size="compact"
                  onClick={() => {
                    setPendingId(block.blocked_user_id);
                    unblockUser.mutate(block.blocked_user_id, {
                      onSettled: () => setPendingId(null)
                    });
                  }}
                  loading={unblockUser.isPending && pendingId === block.blocked_user_id}
                >
                  Unblock
                </Button>
              </Card>
            ))}
          </div>
        )}
      </AsyncView>
    </div>
  );
}
