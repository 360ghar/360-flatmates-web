import type { MouseEvent, ReactNode } from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/Card";

export interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  description?: string;
  /**
   * Internal route to navigate to when the card is clicked. When set, the card
   * is rendered as a link. Mutually exclusive with `onClick`.
   */
  href?: string;
  /** Click handler for the card. Mutually exclusive with `href`. */
  onClick?: () => void;
}

export function StatCard({
  icon,
  label,
  value,
  description,
  href,
  onClick
}: StatCardProps) {
  const body = icon ? (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-label-md text-ink-3">{label}</p>
        <p className="text-h2 tabular-nums text-ink">{value}</p>
        {description ? (
          <p className="mt-0.5 text-caption text-ink-3">{description}</p>
        ) : null}
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-1">
      <p className="text-label-md text-ink-3">{label}</p>
      <p className="text-h2 text-ink tabular-nums">{value}</p>
      {description ? (
        <p className="text-caption text-ink-3">{description}</p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        to={href}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <Card className="h-full p-5 transition-shadow hover:shadow-hover">
          {body}
        </Card>
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick as (e: MouseEvent<HTMLButtonElement>) => void}
        className="block w-full rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <Card className="h-full p-5 transition-shadow hover:shadow-hover">
          {body}
        </Card>
      </button>
    );
  }

  if (icon) {
    return <Card className="p-5">{body}</Card>;
  }

  return <Card className="p-4">{body}</Card>;
}
