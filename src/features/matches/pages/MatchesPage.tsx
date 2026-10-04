import { useMatches } from "@/features/matches/hooks/useMatches";
import { profileToProfileGridCardProps } from "@/features/matches/lib/adapters";
import { PeopleGrid } from "@/features/matches/components/PeopleGrid";
import { Page, PageHeader } from "@/components/ui/Layout";

export function MatchesPage() {
  const matchesQuery = useMatches();

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
      />
    </Page>
  );
}
