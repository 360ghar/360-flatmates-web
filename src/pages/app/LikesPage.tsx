import { useState } from "react";
import { useNavigate } from "react-router";
import { useIncomingLikesInfinite, useMatches, useUnmatchMutation } from "@/hooks/queries/useMatches";
import { useSwipeAction } from "@/hooks/queries/useSwipes";
import { profileToProfileGridCardProps } from "@/lib/api/adapters";
import { PeopleGridPage } from "@/components/organisms/PeopleGridPage";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useCreateConversation } from "@/hooks/queries/useConversations";
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
    <div className="flex flex-col gap-5 page-fade">
      <h1 className="text-h1">Likes & Matches</h1>

      <SegmentedControl
        ariaLabel="Likes and matches"
        className="self-start"
        options={[
          { value: "likes", label: "Likes" },
          { value: "matches", label: "Matches" }
        ]}
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
      />

      {tab === "likes" ? (
        <PeopleGridPage
          title=""
          subtitle="People who liked you"
          query={likesQuery}
          emptyTitle="No likes yet"
          emptyDescription="Keep exploring to find connections!"
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
        <PeopleGridPage
          title=""
          subtitle="People you matched with"
          query={matchesQuery}
          emptyTitle="No matches yet"
          emptyDescription="Keep swiping to find your match!"
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
    </div>
  );
}
