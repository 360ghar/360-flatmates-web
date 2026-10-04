import type { ConversationSummary } from "@/lib/api/types";
import { userMessage } from "@/lib/api/errors";
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
  fetchNextPageError,
  onLoadMore
}: {
  conversations: ConversationSummary[] | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
  onRetry: () => void;
  selectedId?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  /** A failed "load more" stays inline by the button; only the first load takes the full error view. */
  fetchNextPageError?: Error | null;
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
        error={conversations === undefined ? error : null}
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
              <div className="flex flex-col items-center gap-1.5 py-1">
                {fetchNextPageError ? (
                  <p role="alert" className="text-body-sm text-danger">
                    {userMessage(fetchNextPageError, "Could not load more conversations.")}
                  </p>
                ) : null}
                <Button variant="tertiary" size="compact" className="self-center" loading={isFetchingNextPage} onClick={onLoadMore}>
                  {fetchNextPageError ? "Try again" : "Load more conversations"}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </AsyncView>
    </section>
  );
}
