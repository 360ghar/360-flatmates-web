import { ArrowLeft, Compass } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useBlockedUsers, useUnblockUser } from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { AsyncView } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils/format";

export function BlockedUsersPage() {
  const navigate = useNavigate();
  const { data: blockedUsers, isLoading, error, refetch } = useBlockedUsers();
  const unblockUser = useUnblockUser();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          aria-label="Back to profile"
          onClick={() => navigate("/profile")}
        >
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
                  <Skeleton className="h-[34px] w-[34px] shrink-0 rounded-full" />
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        }
        empty={
          <Card className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-body-md text-ink-3">
              No blocked users. You can block someone from their profile or conversation.
            </p>
            <Button
              variant="secondary"
              size="compact"
              onClick={() => navigate("/explore")}
              leadingIcon={<Compass aria-hidden="true" className="h-4 w-4" />}
            >
              Find flatmates
            </Button>
          </Card>
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
                    <p className="text-caption text-ink-3 truncate">
                      {block.blocked_user.locality
                        ? `${block.blocked_user.locality} · `
                        : ""}
                      Blocked on {formatDate(block.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="tertiary"
                  size="compact"
                  onClick={() =>
                    setConfirmTarget({
                      id: block.blocked_user.id,
                      name: block.blocked_user.full_name
                    })
                  }
                  loading={
                    unblockUser.isPending && pendingId === block.blocked_user.id
                  }
                >
                  Unblock
                </Button>
              </Card>
            ))}
          </div>
        )}
      </AsyncView>

      <Modal
        open={confirmTarget !== null}
        title={`Unblock ${confirmTarget?.name ?? "user"}?`}
        description="They will be able to see your profile and message you again."
        onClose={() => setConfirmTarget(null)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmTarget(null)}
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={
                unblockUser.isPending &&
                pendingId === (confirmTarget?.id ?? null)
              }
              onClick={() => {
                if (!confirmTarget) return;
                const targetId = confirmTarget.id;
                setPendingId(targetId);
                setConfirmTarget(null);
                unblockUser.mutate(targetId, {
                  onSettled: () => setPendingId(null),
                  onSuccess: () => {
                    uiStore.getState().pushToast({
                      type: "success",
                      title: "User unblocked"
                    });
                  },
                  onError: () => {
                    uiStore.getState().pushToast({
                      type: "error",
                      title: "Could not unblock user",
                      description: "Please try again."
                    });
                  }
                });
              }}
              className="w-full md:w-auto"
            >
              Unblock
            </Button>
          </>
        }
      />
    </div>
  );
}
