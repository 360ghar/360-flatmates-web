import { useMatches } from "@/hooks/queries/useMatches";
import { profileToProfileGridCardProps } from "@/lib/api/adapters";
import { PeopleGridPage } from "@/components/organisms/PeopleGridPage";

export function MatchesPage() {
  const matchesQuery = useMatches();

  return (
    <PeopleGridPage
      title="Matches"
      subtitle="People you matched with"
      query={matchesQuery}
      emptyTitle="No matches yet"
      emptyDescription="Keep swiping to find your match!"
      ctaLabel="Chat"
      getPeerId={(match) => String(match.peer.id)}
      getProfileProps={(match) => profileToProfileGridCardProps(match.peer)}
    />
  );
}
