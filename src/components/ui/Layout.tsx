import { createContext, useCallback, useContext, type HTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, WifiOff } from "lucide-react";
import { Button } from "./Button";
import { cn } from "./component-utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * What the surrounding shell already shows for this page. The app shell sets
 * it from the route handle: on phones a secondary page's title and Back live
 * in the top bar, so the page header does not repeat them there.
 */
export interface PageChrome {
  back?: string;
  titleInTopBar?: boolean;
  /** Inside the app shell, which already owns the gutters and page width. */
  shell?: boolean;
}

export const PageChromeContext = createContext<PageChrome>({});

/** Back to the previous in-app page; `fallback` when the page was opened directly. */
export function useBack(fallback = "/home") {
  const navigate = useNavigate();
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback);
  }, [navigate, fallback]);
}

export type PageWidth = "narrow" | "default" | "wide";

const pageWidth: Record<PageWidth, string> = {
  narrow: "max-w-[640px]",
  default: "max-w-[960px]",
  wide: "max-w-[var(--page-max)]"
};

export interface PageProps extends HTMLAttributes<HTMLDivElement> {
  /** narrow: forms and settings. default: lists. wide: grids and dashboards. */
  width?: PageWidth;
}

/** The column every app page sits in. The shell owns the gutters. */
export function Page({ width = "default", className, ...props }: PageProps) {
  return <div className={cn("page-fade mx-auto flex w-full flex-col gap-6", pageWidth[width], className)} {...props} />;
}

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** A picture before the title, such as an avatar. */
  media?: ReactNode;
  /** Back target when there is no in-app history; defaults to the route's. false hides it. */
  back?: string | false;
}

export function PageHeader({ title, description, actions, media, back, className, ...props }: PageHeaderProps) {
  const chrome = useContext(PageChromeContext);
  const backTo = back === false ? undefined : back ?? chrome.back;
  const goBack = useBack(backTo);

  return (
    <header className={cn("flex flex-wrap items-start gap-x-3 gap-y-4", className)} {...props}>
      {backTo ? (
        <Button
          aria-label="Back"
          size="icon"
          variant="icon"
          onClick={goBack}
          className={cn("-ml-2.5 mt-0.5", chrome.titleInTopBar && "max-md:hidden")}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
      ) : null}
      {media ? <div className="shrink-0">{media}</div> : null}
      <div className={cn("min-w-0 flex-1", media ? "basis-40 self-center" : "basis-64")}>
        <h1 className={cn("text-h1 text-ink", chrome.titleInTopBar && !description && "max-md:sr-only")}>{title}</h1>
        {description ? <p className="mt-2 max-w-[62ch] text-body-lg text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** The page column for pages that render in both layouts (browse, search). */
export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { shell } = useContext(PageChromeContext);
  return <div className={cn(shell ? "mx-auto w-full max-w-[var(--page-max)]" : "page-container", className)} {...props} />;
}

export interface PageBandProps extends PageHeaderProps {
  /** Small scene or art shown to the right from lg. */
  aside?: ReactNode;
  /** Breadcrumbs or a short line above the title. */
  above?: ReactNode;
}

/**
 * A public page's header: a paper-1 band with a torn bottom edge across the
 * page. Inside the app shell it becomes an inset paper card instead.
 */
export function PageBand({ aside, above, className, ...header }: PageBandProps) {
  const { shell } = useContext(PageChromeContext);
  const inner = (
    <div className="flex items-center justify-between gap-10">
      <div className="min-w-0 flex-1">
        {above ? <div className="mb-4">{above}</div> : null}
        <PageHeader back={false} {...header} />
      </div>
      {aside ? <div aria-hidden="true" className="hidden w-[220px] shrink-0 lg:block">{aside}</div> : null}
    </div>
  );
  if (shell) {
    return <div className={cn("paper-grain mx-auto w-full max-w-[var(--page-max)] rounded-hand bg-paper-1 p-6 shadow-xs md:p-8", className)}>{inner}</div>;
  }
  return (
    <div className={cn("paper-edge-torn-bottom paper-grain bg-paper-1 pb-[calc(var(--torn-depth)+32px)] pt-10 md:pb-[calc(var(--torn-depth)+44px)] md:pt-14", className)}>
      <div className="page-container">{inner}</div>
    </div>
  );
}

export interface BottomActionBarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Sticky paper strip for a form's primary actions. */
export function BottomActionBar({ children, className, ...props }: BottomActionBarProps) {
  return (
    <div
      className={cn(
        "paper-grain sticky bottom-0 z-[var(--z-sticky)] mt-6 bg-paper-1 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--color-edge),0_-3px_6px_-4px_rgb(35_32_28/0.14)]",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-[var(--page-max)] items-center justify-end gap-3">{children}</div>
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
