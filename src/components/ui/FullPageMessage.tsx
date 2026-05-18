import type { ReactNode } from "react";
import { cn } from "./component-utils";

export interface FullPageMessageProps {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function FullPageMessage({
  icon,
  iconClassName = "bg-warning-soft text-warning",
  title,
  description,
  action,
  className,
}: FullPageMessageProps) {
  return (
    <main
      id="main"
      className={cn(
        "grid min-h-screen place-items-center bg-paper px-6 text-ink",
        className,
      )}
    >
      <section className="animate-fade-slide-up max-w-md text-center">
        <div
          className={cn(
            "mx-auto mb-5 grid size-28 place-items-center rounded-2xl",
            iconClassName,
          )}
        >
          {icon}
        </div>
        <h1 className="text-h1">{title}</h1>
        <p className="mt-3 text-body-md text-ink-2">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </section>
    </main>
  );
}
