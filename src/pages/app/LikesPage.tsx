import { useState } from "react";
import { useIncomingLikesInfinite, useMatches } from "@/hooks/queries/useMatches";
import { profileToProfileGridCardProps } from "@/lib/api/adapters";
import { PeopleGridPage } from "@/components/organisms/PeopleGridPage";
import { cn } from "@/components/ui/component-utils";

type Tab = "likes" | "matches";

export function LikesPage() {
  const [tab, setTab] = useState<Tab>("likes");
  const likesQuery = useIncomingLikesInfinite();
  const matchesQuery = useMatches();

  return (
    <div className="flex flex-col gap-5 page-fade">
      <h1 className="text-h1">Likes & Matches</h1>

      <div className="flex gap-1 rounded-[9px] bg-paper-2 p-1">
        <button
          type="button"
          onClick={() => setTab("likes")}
          className={cn(
            "flex-1 rounded-[7px] px-4 py-2 text-body-md font-semibold transition-colors",
            tab === "likes" ? "bg-paper text-ink shadow-sm" : "text-ink-3 hover:text-ink"
          )}
        >
          Likes
        </button>
        <button
          type="button"
          onClick={() => setTab("matches")}
          className={cn(
            "flex-1 rounded-[7px] px-4 py-2 text-body-md font-semibold transition-colors",
            tab === "matches" ? "bg-paper text-ink shadow-sm" : "text-ink-3 hover:text-ink"
          )}
        >
          Matches
        </button>
      </div>

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
        />
      )}
    </div>
  );
}
