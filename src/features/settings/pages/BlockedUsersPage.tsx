import { Compass } from "lucide-react";
import { Page, PageHeader } from "@/components/ui/Layout";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useBlockedUsers, useUnblockUser } from "@/features/settings/hooks/useBlocks";
import { uiStore } from "@/lib/stores/ui-store";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { AsyncView } from "@/components/ui/StateViews";
import { BlockedUserRowSkeleton } from "@/features/settings/components/BlockedUserRowSkeleton";
import { formatDate } from "@/lib/utils/format";
import { PEER_NAME_FALLBACK } from "@/lib/api/peer-fields";

export function BlockedUsersPage() {
  const navigate = useNavigate();
  const { data: blockedUsers, isLoading, error, refetch } = useBlockedUsers();
  const unblockUser = useUnblockUser();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);

  return (
    <Page width="narrow">
      <PageHeader title="Blocked users" />

      <AsyncView
        data={blockedUsers ?? []}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        loading={<BlockedUserRowSkeleton count={3} />}
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
            {data.map((block) => {
              const name = block.blocked_user.display_name?.trim() || PEER_NAME_FALLBACK;
              return (
                <Card key={block.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={name}
                      src={block.blocked_user.avatar_url}
                      size="compact"
                      shape="circle"
                    />
                    <div className="min-w-0">
                      <p className="text-body-md font-semibold text-ink truncate">{name}</p>
                      {block.created_at ? (
                        <p className="text-caption text-ink-3 truncate">
                          Blocked on {formatDate(block.created_at)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    variant="tertiary"
                    size="compact"
                    onClick={() => setConfirmTarget({ id: block.blocked_user_id, name })}
                    loading={unblockUser.isPending && pendingId === block.blocked_user_id}
                  >
                    Unblock
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </AsyncView>

      <Modal
        open={confirmTarget !== null}
        title={`Unblock ${confirmTarget?.name ?? "user"}?`}
        description="They will be able to see your profile again. Your old chat stays closed until you both like each other again."
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
    </Page>
  );
}
