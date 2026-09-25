import type { HTMLAttributes, ReactNode } from "react";
import { ArrowLeft, WifiOff } from "lucide-react";
import { Button } from "./Button";
import { cn } from "./component-utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export interface PageLayoutProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  maxWidth?: "none" | "default" | "wide";
}

export function PageLayout({
  children,
  maxWidth = "default",
  className,
  ...props
}: PageLayoutProps) {
  return (
    <div
      className={cn("min-h-screen bg-paper px-5 py-6 text-ink animate-fade-in md:px-6", className)}
      {...props}
    >
      <div
        className={cn(
          "mx-auto w-full",
          maxWidth === "default" && "max-w-7xl",
          maxWidth === "wide" && "max-w-screen-2xl"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  eyebrow?: string;
  description?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  onBack,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-start md:justify-between", className)} {...props}>
      <div className="flex min-w-0 items-start gap-3">
        {onBack ? (
          <Button aria-label="Go back" size="icon" variant="icon" onClick={onBack}>
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </Button>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="text-eyebrow">{eyebrow}</p> : null}
          <h1 className="text-h1 font-normal text-ink">{title}</h1>
          {description ? <p className="mt-2 max-w-[65ch] text-body-md text-ink-2">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export interface BottomActionBarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function BottomActionBar({ children, className, ...props }: BottomActionBarProps) {
  return (
    <div
      className={cn(
        "paper-grain sticky bottom-0 z-[var(--z-sticky)] -mx-5 mt-6 bg-paper-1 px-5 py-3 shadow-[0_-1px_0_var(--color-edge),0_-3px_6px_-4px_rgb(35_32_28/0.14)] md:-mx-6 md:px-6",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3">{children}</div>
    </div>
  );
}

export interface OfflineBannerProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

/** In-flow scalloped strip (DESIGN.md §8). Renders only while offline and
 *  pushes the page down instead of covering the header. */
export function OfflineBanner({
  label = "You are offline. Showing what was already loaded.",
  className,
  ...props
}: OfflineBannerProps) {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className={cn(
        "paper-edge-scallop-bottom flex min-h-11 items-center justify-center gap-2 bg-warning-soft px-4 pb-4 pt-2.5 text-center text-body-md font-semibold text-warning-ink",
        className
      )}
      {...props}
    >
      <WifiOff aria-hidden="true" className="h-5 w-5 shrink-0" />
      {label}
    </div>
  );
}
