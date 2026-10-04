import type { MatchSummary } from "@/lib/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, focusRing } from "@/components/ui/component-utils";

/** People you matched with, in one scrolling row; tap one to start a chat. */
export function MatchesStrip({
  matches,
  isLoading,
  onStartChat
}: {
  matches: MatchSummary[] | undefined;
  isLoading: boolean;
  onStartChat: (peerId: number) => void;
}) {
  if (!isLoading && !matches?.length) return null;
  return (
    <section aria-labelledby="matches-strip-heading" className="flex flex-col gap-2">
      <h2 id="matches-strip-heading" className="text-h4 text-ink">
        Your matches
      </h2>
      <div className="bleed-x scrollbar-none flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:px-0">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 p-1.5">
                <Skeleton className="h-[52px] w-[52px] rounded-cut-md" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))
          : matches!.map(({ id, peer }) => (
              <button
                key={id}
                type="button"
                aria-label={`Start chat with ${peer.full_name}, ${peer.match_percentage ?? 0}% compatible`}
                onClick={() => onStartChat(peer.id)}
                className={cn("flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-cut-md p-1.5 hover:bg-surface-soft", focusRing)}
              >
                <Avatar name={peer.full_name} src={peer.profile_image_url} size="md" />
                <span className="max-w-full truncate text-caption font-semibold text-ink-2">{peer.full_name.split(" ")[0]}</span>
                <span aria-hidden="true" className="tabular text-caption text-pine">
                  {peer.match_percentage ?? 0}%
                </span>
              </button>
            ))}
      </div>
    </section>
  );
}
