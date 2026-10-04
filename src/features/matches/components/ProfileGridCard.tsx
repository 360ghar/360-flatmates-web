import type { HTMLAttributes } from "react";
import { MapPin } from "lucide-react";
import { ProfileIcon } from "@/components/paper/NavIcons";
import { Button } from "@/components/ui/Button";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { cn, focusRing } from "@/components/ui/component-utils";

export interface ProfileGridCardData {
  id: string;
  name: string;
  age?: number;
  location?: string;
  profession?: string;
  photoUrl?: string | null;
  matchScore: number;
}

export interface ProfileGridCardProps extends HTMLAttributes<HTMLElement> {
  profile: ProfileGridCardData;
  ctaLabel?: string;
  blurred?: boolean;
  /** Kept for call-site compatibility. */
  density?: "comfortable" | "compact";
  onMatch?: (profileId: string) => void;
  onOpen?: (profileId: string) => void;
}

/**
 * A person on a paper card: photo (or a cut-paper figure), score, name, a
 * line about them and one action. The name opens the profile.
 */
export function ProfileGridCard({ profile, ctaLabel = "Match", blurred = false, onMatch, onOpen, className, ...props }: ProfileGridCardProps) {
  return (
    <article
      className={cn(
        "paper-grain group relative flex min-w-0 flex-col overflow-hidden rounded-hand bg-surface shadow-sm transition-[transform,box-shadow] duration-200",
        onOpen && "paper-lift",
        className
      )}
      {...props}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-1">
        {profile.photoUrl ? (
          <NetworkImage alt="" src={profile.photoUrl} wrapperClassName={cn("h-full w-full rounded-none", blurred && "blur-sm")} />
        ) : (
          <ProfileIcon aria-hidden="true" className="absolute bottom-0 left-1/2 h-[78%] w-auto -translate-x-1/2 text-scene-hill-near" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="tabular text-label-md text-pine">{Math.round(profile.matchScore)}% match</p>
        <h3 className="mt-0.5 truncate text-body-lg font-semibold text-ink">
          {onOpen ? (
            <button
              type="button"
              onClick={() => onOpen(profile.id)}
              className={cn("max-w-full truncate text-left after:absolute after:inset-0 after:content-[''] hover:text-clay", focusRing)}
            >
              {profile.name}
            </button>
          ) : (
            profile.name
          )}
        </h3>
        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-caption text-ink-3">
          {profile.age ? <span className="tabular-nums">{profile.age}</span> : null}
          {profile.age && profile.location ? <span aria-hidden="true">·</span> : null}
          {profile.location ? (
            <>
              <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span className="truncate">{profile.location}</span>
            </>
          ) : null}
        </p>
        {profile.profession ? <p className="mt-0.5 truncate text-caption text-ink-3">{profile.profession}</p> : null}
        {onMatch ? (
          <Button variant="secondary" size="compact" fullWidth className="relative z-[1] mt-3" onClick={() => onMatch(profile.id)}>
            {ctaLabel}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
