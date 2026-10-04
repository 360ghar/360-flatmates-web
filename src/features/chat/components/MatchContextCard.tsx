import type { HTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { Badge, type UserMode } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";
import { cn } from "@/components/ui/component-utils";

export interface MatchContextCardData {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  mode?: UserMode;
  locality?: string;
  rent: number;
  details?: ReactNode;
}

export interface MatchContextCardProps extends HTMLAttributes<HTMLElement> {
  item: MatchContextCardData;
  defaultExpanded?: boolean;
  onViewListing?: (id: string) => void;
}

export function MatchContextCard({
  item,
  defaultExpanded = false,
  onViewListing,
  className,
  ...props
}: MatchContextCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card as="article" className={cn("p-3", className)} {...props}>
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <NetworkImage alt={item.title} src={item.thumbnailUrl} wrapperClassName="h-20 w-[88px] shrink-0 rounded-cut-md" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-body-md font-semibold text-ink">{item.title}</span>
            {item.mode ? <Badge mode={item.mode} variant="mode" /> : null}
          </span>
          <PriceText value={item.rent} variant="inline" />
          {item.locality ? (
            <span className="mt-1 flex items-center gap-1 text-caption text-ink-3">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {item.locality}
            </span>
          ) : null}
        </span>
        <ChevronRight
          aria-hidden="true"
          className={cn("h-5 w-5 shrink-0 text-ink-3 transition-transform duration-200 ease-out", expanded && "rotate-90")}
        />
      </button>
      {expanded ? (
        <div className="mt-3 border-t border-line pt-3">
          {item.details ? <div className="text-body-md text-ink-2">{item.details}</div> : null}
          <Button className="mt-3" size="compact" variant="secondary" onClick={() => onViewListing?.(item.id)}>
            View Listing
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

