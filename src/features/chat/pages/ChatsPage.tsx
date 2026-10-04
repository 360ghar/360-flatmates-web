import { useMemo } from "react";
import { useMatch, useNavigate, useOutlet } from "react-router";
import { userMessage } from "@/lib/api/errors";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { uiStore } from "@/lib/stores/ui-store";
import { EmptyState } from "@/components/ui/StateViews";
import { Page, PageHeader } from "@/components/ui/Layout";
import { useCreateConversation, useInfiniteConversations } from "@/features/chat/hooks/useConversations";
import { useMatches } from "@/features/matches/hooks/useMatches";
import { ConversationsPanel } from "@/features/chat/components/ConversationsPanel";
import { MatchesStrip } from "@/features/chat/components/MatchesStrip";

/* The shell's height below the top bar, less <main>'s padding (py-6, md:py-8). */
const THREAD_HEIGHT =
  "-mx-[var(--gutter)] -my-6 h-[calc(100dvh-var(--topbar-h)-var(--bottom-nav-h)-env(safe-area-inset-bottom))] md:mx-0 md:my-0 md:h-[calc(100dvh-var(--topbar-h)-64px)] md:min-h-[520px]";

/**
 * The chat list, and the thread route inside it. Below lg a thread takes the
 * whole screen; from lg the list and the open thread sit side by side.
 */
export function ChatsPage() {
  const navigate = useNavigate();
  const outlet = useOutlet();
  const selectedId = useMatch("/chats/:id")?.params.id;
  const isSplit = useMediaQuery("(min-width: 1024px)");

  const conversationsQuery = useInfiniteConversations();
  const conversations = useMemo(
    () => conversationsQuery.data?.pages.flatMap((page) => page.items ?? []),
    [conversationsQuery.data]
  );
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const createConversation = useCreateConversation();

  function startChat(peerUserId: number) {
    createConversation.mutate(
      { peer_user_id: peerUserId },
      {
        onSuccess: (conversation) => navigate(`/chats/${conversation.id}`),
        onError: (err) =>
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not start the chat",
            description: userMessage(err, "Please try again.")
          })
      }
    );
  }

  if (outlet && !isSplit) return <div className={THREAD_HEIGHT}>{outlet}</div>;

  const list = (
    <>
      <PageHeader title="Chats" back={false} />
      <MatchesStrip matches={matches} isLoading={matchesLoading} onStartChat={startChat} />
      <ConversationsPanel
        conversations={conversations}
        isLoading={conversationsQuery.isLoading}
        error={conversationsQuery.error}
        onRetry={() => void conversationsQuery.refetch()}
        selectedId={selectedId}
        hasNextPage={conversationsQuery.hasNextPage}
        isFetchingNextPage={conversationsQuery.isFetchingNextPage}
        onLoadMore={() => void conversationsQuery.fetchNextPage()}
      />
    </>
  );

  if (!isSplit) return <Page>{list}</Page>;

  return (
    <div className="page-fade mx-auto grid h-[calc(100dvh-var(--topbar-h)-64px)] min-h-[560px] max-w-[var(--page-max)] grid-cols-[340px_minmax(0,1fr)] gap-6">
      <div className="scrollbar-thin -mr-2 flex min-h-0 flex-col gap-6 overflow-y-auto pr-2">{list}</div>
      <div className="min-h-0">
        {outlet ?? (
          <div className="paper-grain grid h-full place-items-center rounded-hand bg-surface shadow-sm">
            <EmptyState scene="chat" title="Pick a conversation" description="Your messages open here." />
          </div>
        )}
      </div>
    </div>
  );
}
