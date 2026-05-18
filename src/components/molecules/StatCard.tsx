import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  description?: string;
}

export function StatCard({ icon, label, value, description }: StatCardProps) {
  if (icon) {
    return (
      <Card className="flex items-start gap-4 p-5">
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
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-1 p-4">
      <p className="text-label-md text-ink-3">{label}</p>
      <p className="text-h2 text-ink tabular-nums">{value}</p>
      {description ? (
        <p className="text-caption text-ink-3">{description}</p>
      ) : null}
    </Card>
  );
}
