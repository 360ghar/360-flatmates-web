import type { HTMLAttributes, ReactNode } from "react";
import { ArrowLeft, WifiOff } from "lucide-react";
import { Button } from "./Button";
import { cn } from "./component-utils";

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
          {eyebrow ? <p className="text-eyebrow uppercase tracking-[0.16em] text-ink-3">{eyebrow}</p> : null}
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
        "sticky bottom-0 z-[var(--z-sticky)] -mx-5 mt-6 border-t border-line bg-paper/88 px-5 py-3 backdrop-blur-[9px] md:-mx-6 md:px-6",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3">{children}</div>
    </div>
  );
}

export interface OfflineBannerProps extends HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
  label?: string;
}

export function OfflineBanner({
  visible = true,
  label = "You are offline",
  className,
  ...props
}: OfflineBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn("fixed inset-x-0 top-0 z-[var(--z-overlay)] flex h-10 items-center justify-center gap-2 bg-paper-3 text-body-md font-medium text-ink-2", className)}
      {...props}
    >
      <WifiOff aria-hidden="true" className="h-5 w-5 text-ink-3" />
      {label}
    </div>
  );
}
