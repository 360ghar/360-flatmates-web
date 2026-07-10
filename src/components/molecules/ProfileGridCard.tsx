import type { HTMLAttributes } from "react";
import { MapPin } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { NetworkImage } from "../ui/NetworkImage";
import { ProgressRing } from "../ui/ProgressRing";
import { cn } from "../ui/component-utils";

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
  /** denser grid: 4–5 columns */
  density?: "comfortable" | "compact";
  onMatch?: (profileId: string) => void;
  onOpen?: (profileId: string) => void;
}

export function ProfileGridCard({
  profile,
  ctaLabel = "Match",
  blurred = false,
  density = "compact",
  onMatch,
  onOpen,
  className,
  ...props
}: ProfileGridCardProps) {
  const compact = density === "compact";

  return (
    <Card
      as="article"
      variant="media"
      interactive={Boolean(onOpen)}
      className={cn("group min-w-0 hover:shadow-hover", className)}
      onClick={() => onOpen?.(profile.id)}
      {...props}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface-soft",
          compact ? "aspect-[3/4]" : "aspect-[4/5]"
        )}
      >
        <NetworkImage
          alt={profile.name}
          src={profile.photoUrl}
          wrapperClassName={cn("h-full w-full rounded-none", blurred && "blur-sm")}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent" />
        <div
          className={cn(
            "absolute rounded-full bg-surface/95 p-0.5 shadow-sm backdrop-blur-sm",
            compact ? "right-1.5 top-1.5" : "right-2 top-2 p-1"
          )}
        >
          <ProgressRing
            size={compact ? "sm" : "md"}
            value={profile.matchScore}
            label="Compatibility score"
          />
        </div>
      </div>

      <div className={cn("bg-surface", compact ? "p-2.5" : "p-3")}>
        <h3 className="truncate text-body-md font-semibold text-ink">{profile.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-caption text-ink-3">
          {profile.age ? <span className="tabular-nums">{profile.age}</span> : null}
          {profile.age && profile.location ? <span aria-hidden="true">·</span> : null}
          {profile.location ? (
            <>
              <MapPin aria-hidden="true" className="h-3 w-3 shrink-0 text-ink-4" />
              <span className="truncate">{profile.location}</span>
            </>
          ) : null}
        </p>
        {profile.profession ? (
          <p className="mt-0.5 truncate text-caption text-ink-3">{profile.profession}</p>
        ) : null}
        <Button
          className={cn("w-full rounded-full", compact ? "mt-2 min-h-9" : "mt-3 min-h-[42px] animate-scale-in")}
          fullWidth
          size="compact"
          onClick={(event) => {
            event.stopPropagation();
            onMatch?.(profile.id);
          }}
        >
          {ctaLabel}
        </Button>
      </div>
    </Card>
  );
}
