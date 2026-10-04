import { useState } from "react";
import { useNavigate } from "react-router";
import { useIncomingLikesInfinite, useMatches, useUnmatchMutation } from "@/features/matches/hooks/useMatches";
import { useSwipeAction } from "@/features/swipe/hooks/useSwipes";
import { profileToProfileGridCardProps } from "@/features/matches/lib/adapters";
import { PeopleGrid } from "@/features/matches/components/PeopleGrid";
import { Page, PageHeader } from "@/components/ui/Layout";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useCreateConversation } from "@/features/chat/hooks/useConversations";
import { uiStore } from "@/lib/stores/ui-store";
import { userMessage } from "@/lib/api/errors";

type Tab = "likes" | "matches";

export function LikesPage() {
  const [tab, setTab] = useState<Tab>("likes");
  const likesQuery = useIncomingLikesInfinite();
  const matchesQuery = useMatches();
  const navigate = useNavigate();
  const swipeAction = useSwipeAction();
  const unmatch = useUnmatchMutation();
  const createConversation = useCreateConversation();

  return (
    <Page width="wide">
      <PageHeader
        title="Likes"
        description={tab === "likes" ? "People who liked you. Like them back to match." : "People you matched with. Say hello."}
        actions={
          <SegmentedControl
            ariaLabel="Show"
            options={[
              { value: "likes", label: "Liked you" },
              { value: "matches", label: "Matches" }
            ]}
            value={tab}
            onValueChange={(value) => setTab(value as Tab)}
          />
        }
      />

      {tab === "likes" ? (
        <PeopleGrid
          query={likesQuery}
          emptyTitle="No likes yet"
          emptyDescription="Likes show up here as soon as someone likes your profile."
          ctaLabel="Match"
          getPeerId={(like) => String(like.peer.id)}
          getProfileProps={(like) => profileToProfileGridCardProps(like.peer)}
          onCta={(like) =>
            // mutateAsync: per-call mutate callbacks only run for the latest call,
            // so two quick like-backs would lose the first result.
            swipeAction
              .mutateAsync({ target_type: "user", target_user_id: like.peer.id, action: "like" })
              .then(
                (result) => {
                  uiStore.getState().pushToast({
                    type: "success",
                    title: result.did_match ? `You matched with ${like.peer.full_name}` : "Liked back"
                  });
                  if (result.did_match && result.conversation_id) navigate(`/chats/${result.conversation_id}`);
                },
                (err) => {
                  uiStore.getState().pushToast({ type: "error", title: "Could not match", description: userMessage(err) });
                }
              )
          }
        />
      ) : (
        <PeopleGrid
          query={matchesQuery}
          emptyTitle="No matches yet"
          emptyDescription="Like someone who liked you, and you match."
          ctaLabel="Chat"
          getPeerId={(match) => String(match.peer.id)}
          getProfileProps={(match) => profileToProfileGridCardProps(match.peer)}
          onCta={(match) =>
            createConversation.mutate(
              { match_id: match.id, peer_user_id: match.peer.id },
              {
                // Open the conversation with this match, not the inbox (W22).
                onSuccess: (conversation) => navigate(`/chats/${conversation.id}`),
                onError: () => navigate("/chats")
              }
            )
          }
          onUnmatch={(match) => unmatch.mutate(match.id)}
        />
      )}
    </Page>
  );
}
