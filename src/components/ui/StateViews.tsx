import type { ReactNode } from "react";
import { PaperMiniScene, type PaperProp } from "@/components/paper/PaperScene";
import { Button } from "./Button";
import { cn } from "./component-utils";

export type { PaperProp };

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Prop in the cut-paper scene (DESIGN.md §6). */
  scene?: PaperProp;
  className?: string;
}

/** Zero-data state: compact paper scene, title, one line, one action. */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  scene = "magnifier",
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-6 text-center", className)}>
      <PaperMiniScene prop={scene} className="w-[70%] max-w-[220px]" />
      <div className="max-w-[34rem]">
        <h3 className="text-h3 text-ink">{title}</h3>
        {description ? <p className="mt-1.5 text-body-md text-ink-2">{description}</p> : null}
      </div>
      {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onRetry?: () => void;
  scene?: PaperProp;
  className?: string;
}

/** Failure state: rain-cloud scene, a human message and Retry. Never raw error text. */
export function ErrorState({
  title = "Something went wrong",
  description,
  actionLabel = "Try again",
  onRetry,
  scene = "rainCloud",
  className
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-4 p-6 text-center", className)}
    >
      <PaperMiniScene prop={scene} className="w-[60%] max-w-[200px]" />
      <div className="max-w-[34rem]">
        <h3 className="text-h3 text-ink">{title}</h3>
        {description ? <p className="mt-1.5 text-body-md text-ink-2">{description}</p> : null}
      </div>
      {onRetry ? <Button onClick={onRetry}>{actionLabel}</Button> : null}
    </div>
  );
}

/** ErrorState on a card, for the API-dependent part of a page whose chrome stays. */
export function InlineError({ className, ...props }: ErrorStateProps) {
  return (
    <div className={cn("paper-grain flex items-center justify-center rounded-hand bg-surface p-8 shadow-sm", className)}>
      <ErrorState {...props} />
    </div>
  );
}

export interface AsyncViewProps<T> {
  data: T | null | undefined;
  isLoading?: boolean;
  error?: Error | null;
  loading?: ReactNode;
  empty?: ReactNode;
  errorView?: ReactNode;
  isEmpty?: (data: T) => boolean;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
}

export function AsyncView<T>({
  data,
  isLoading = false,
  error,
  loading,
  empty,
  errorView,
  isEmpty,
  onRetry,
  children
}: AsyncViewProps<T>) {
  if (isLoading) {
    return <>{loading}</>;
  }

  if (error) {
    return <>{errorView ?? <ErrorState onRetry={onRetry} />}</>;
  }

  if (data === null || data === undefined || (isEmpty && isEmpty(data))) {
    return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  }

  return <>{children(data)}</>;
}

