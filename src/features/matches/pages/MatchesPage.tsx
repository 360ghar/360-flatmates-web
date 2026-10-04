import { useNavigate } from "react-router";
import { useMatches } from "@/features/matches/hooks/useMatches";
import { profileToProfileGridCardProps } from "@/features/matches/lib/adapters";
import { PeopleGrid } from "@/features/matches/components/PeopleGrid";
import { Page, PageHeader } from "@/components/ui/Layout";
import { useCreateConversation } from "@/features/chat/hooks/useConversations";
import { userMessage } from "@/lib/api/errors";
import { uiStore } from "@/lib/stores/ui-store";

export function MatchesPage() {
  const matchesQuery = useMatches();
  const navigate = useNavigate();
  const createConversation = useCreateConversation();

  return (
    <Page width="wide">
      <PageHeader title="Matches" description="People you matched with. Say hello." />
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
              onSuccess: (conversation) => navigate(`/chats/${conversation.id}`),
              onError: (err) =>
                uiStore.getState().pushToast({
                  type: "error",
                  title: "Could not open the chat",
                  description: userMessage(err)
                })
            }
          )
        }
      />
    </Page>
  );
}
