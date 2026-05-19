import { useIncomingLikes } from "@/hooks/queries/useMatches";
import { profileToProfileGridCardProps } from "@/lib/api/adapters";
import { PeopleGridPage } from "@/components/organisms/PeopleGridPage";

export function LikesPage() {
  const likesQuery = useIncomingLikes();

  return (
    <PeopleGridPage
      title="Likes"
      subtitle="People who liked you"
      query={likesQuery}
      emptyTitle="No likes yet"
      emptyDescription="Keep exploring to find connections!"
      ctaLabel="Match"
      getPeerId={(like) => String(like.peer.id)}
      getProfileProps={(like) => profileToProfileGridCardProps(like.peer)}
    />
  );
}
