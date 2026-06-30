import { useNavigate } from "react-router";
import { useConversations, useMatches, useCreateConversation } from "@/hooks/queries";
import { conversationToConversationRowProps } from "@/lib/api/adapters";
import type { ConversationSummary, MatchSummary } from "@/lib/api/types";
import { uiStore } from "@/lib/stores/ui-store";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";
import { ConversationRow } from "@/components/molecules/ConversationRow";
import { cn, getInitials } from "@/components/ui/component-utils";

export function ChatsPage() {
  const navigate = useNavigate();
  const { data: conversations, isLoading, error, refetch } = useConversations();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const createConversation = useCreateConversation();

  function handleStartConversation(peerUserId: number) {
    createConversation.mutate(
      { peer_user_id: peerUserId },
      {
        onSuccess: (conversation) => {
          uiStore.getState().pushToast({
            type: "success",
            title: "Conversation started"
          });
          navigate(`/chats/${conversation.id}`);
        },
        onError: (err) => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not start conversation",
            description: err instanceof Error ? err.message : "Please try again."
          });
        }
      }
    );
  }

  return (
    <div className="flex flex-col page-fade">
      <h1 className="text-h1 mb-4">Chats</h1>

      {/* ── Mobile: vertical layout (matches bar + conversations) ── */}
      <div className="flex flex-col md:hidden">
        <MatchesBar matches={matches} matchesLoading={matchesLoading} onStartChat={handleStartConversation} />
        <div className="border-t border-line my-4" />
        <section aria-labelledby="mobile-conversations-heading">
          <h2 id="mobile-conversations-heading" className="text-h3 mb-3">Conversations</h2>
          <ConversationsPanel
            conversations={conversations}
            isLoading={isLoading}
            error={error}
            refetch={refetch}
            onNavigate={(id) => navigate(`/chats/${id}`)}
          />
        </section>
      </div>

      {/* ── Tablet / Desktop: side-by-side split layout ── */}
      <div className="hidden md:flex md:gap-0 md:rounded-2xl md:border md:border-line md:bg-surface md:overflow-hidden md:min-h-[60vh]">
        {/* Left panel: Matches */}
        <aside className="w-72 lg:w-80 border-r border-line flex flex-col shrink-0">
          <div className="p-4 pb-2">
            <h2 className="text-h3">Your Matches</h2>
          </div>
          <MatchesList
            matches={matches}
            matchesLoading={matchesLoading}
            onStartChat={handleStartConversation}
          />
        </aside>

        {/* Right panel: Conversations */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="p-4 pb-2">
            <h2 className="text-h3">Conversations</h2>
          </div>
          <ConversationsPanel
            conversations={conversations}
            isLoading={isLoading}
            error={error}
            refetch={refetch}
            onNavigate={(id) => navigate(`/chats/${id}`)}
          />
        </section>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Mobile: horizontal scrolling matches bar                    */
/* ──────────────────────────────────────────────────────────── */

function MatchesBar({
  matches,
  matchesLoading,
  onStartChat,
}: {
  matches: MatchSummary[] | undefined;
  matchesLoading: boolean;
  onStartChat: (peerId: number) => void;
}) {
  if (matchesLoading) {
    return (
      <section aria-label="Your Matches" className="mb-4">
        <h2 className="text-h3 mb-3">Your Matches</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-2.5 w-10" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        description="Keep swiping to find your match!"
      />
    );
  }

  return (
    <section aria-label="Your Matches" className="mb-4">
      <h2 className="text-h3 mb-3">Your Matches</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {matches.map((match) => {
          const peer = match.peer;
          return (
            <button
              key={match.id}
              type="button"
              className={cn(
                "flex flex-col items-center shrink-0 rounded-[9px] p-1.5 gap-1 w-16",
                "hover:bg-accent-soft transition-colors duration-150 ease-out",
                "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              )}
              onClick={() => onStartChat(peer.id)}
              aria-label={`Start chat with ${peer.full_name}`}
            >
              <div className="relative">
                <MatchAvatar name={peer.full_name} src={peer.profile_image_url} />
                <span className="absolute -bottom-0.5 -right-0.5">
                  <ProgressRing size="sm" value={peer.match_percentage ?? 0} label="Compatibility score" />
                </span>
              </div>
              <span className="max-w-[56px] truncate text-[10px] font-medium text-ink-2">
                {peer.full_name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Tablet/Desktop: vertical matches list (avatar + info row)   */
/* ──────────────────────────────────────────────────────────── */

function MatchesList({
  matches,
  matchesLoading,
  onStartChat,
}: {
  matches: MatchSummary[] | undefined;
  matchesLoading: boolean;
  onStartChat: (peerId: number) => void;
}) {
  if (matchesLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-24 mb-1.5" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <EmptyState
          title="No matches yet"
          description="Keep swiping to find your match!"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
      {matches.map((match) => {
        const peer = match.peer;
        return (
          <button
            key={match.id}
            type="button"
            className={cn(
              "flex items-center gap-3 rounded-[9px] p-2 text-left",
              "hover:bg-accent-soft transition-colors duration-150 ease-out",
              "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            )}
            onClick={() => onStartChat(peer.id)}
            aria-label={`Start chat with ${peer.full_name}`}
          >
            <div className="relative shrink-0">
              <MatchAvatar name={peer.full_name} src={peer.profile_image_url} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5">
                <ProgressRing size="sm" value={peer.match_percentage ?? 0} label="Compatibility score" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-md font-semibold text-ink">
                {peer.full_name}
              </p>
              {peer.profession && (
                <p className="truncate text-caption text-ink-3">{peer.profession}</p>
              )}
            </div>
            <span className="shrink-0 text-caption font-semibold text-accent">
              {peer.match_percentage ?? 0}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Shared: conversations panel (used in both layouts)          */
/* ──────────────────────────────────────────────────────────── */

function ConversationsPanel({
  conversations,
  isLoading,
  error,
  refetch,
  onNavigate,
}: {
  conversations: ConversationSummary[] | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
  refetch: () => void;
  onNavigate: (id: number) => void;
}) {
  return (
    <AsyncView
      data={conversations}
      isLoading={isLoading}
      error={error}
      isEmpty={(data) => data.length === 0}
      loading={<Skeleton variant="conversationRow" count={5} />}
      empty={
        <EmptyState
          title="No conversations yet"
          description="Start chatting with your matches!"
        />
      }
      onRetry={() => refetch()}
    >
      {(data) => (
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 p-2">
          {data.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversationToConversationRowProps(conversation)}
              onClick={() => onNavigate(conversation.id)}
            />
          ))}
        </div>
      )}
    </AsyncView>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Shared: inline match avatar (avoids Avatar component's      */
/* fixed sizes — allows responsive Tailwind classes)           */
/* ──────────────────────────────────────────────────────────── */

function MatchAvatar({
  name,
  src,
  size = "mobile",
}: {
  name: string;
  src?: string | null;
  size?: "mobile" | "sm";
}) {
  const sizeClass = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const textSizeClass = size === "sm" ? "text-xs" : "text-[10px]";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full shrink-0",
        sizeClass,
        "bg-gradient-to-br from-accent to-accent/70 font-semibold text-white shadow-md"
      )}
    >
      {src ? (
        <img
          alt={name}
          className="h-full w-full object-cover"
          src={src}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span aria-hidden="true" className={textSizeClass}>
          {getInitials(name)}
        </span>
      )}
    </span>
  );
}
