import type { ConversationSummary } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { ConversationRowSkeleton } from "@/features/chat/components/ConversationRowSkeleton";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";
import { ConversationRow } from "@/features/chat/components/ConversationRow";
import { conversationToConversationRowProps } from "@/features/chat/lib/adapters";

export function ConversationsPanel({
  conversations,
  isLoading,
  error,
  onRetry,
  selectedId,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore
}: {
  conversations: ConversationSummary[] | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
  onRetry: () => void;
  selectedId?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}) {
  return (
    <section aria-labelledby="conversations-heading" className="flex flex-col gap-2">
      <h2 id="conversations-heading" className="text-h4 text-ink">
        Conversations
      </h2>
      <AsyncView
        data={conversations}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        loading={<ConversationRowSkeleton count={5} className="flex flex-col gap-1" />}
        empty={<EmptyState scene="chat" title="No conversations yet" description="Say hello to one of your matches." />}
        onRetry={onRetry}
      >
        {(data) => (
          <div className="paper-grain flex flex-col gap-0.5 rounded-hand bg-surface p-1.5 shadow-sm">
            {data.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                to={`/chats/${conversation.id}`}
                selected={String(conversation.id) === selectedId}
                conversation={conversationToConversationRowProps(conversation)}
              />
            ))}
            {hasNextPage ? (
              <Button variant="tertiary" size="compact" className="self-center" loading={isFetchingNextPage} onClick={onLoadMore}>
                Load more conversations
              </Button>
            ) : null}
          </div>
        )}
      </AsyncView>
    </section>
  );
}
