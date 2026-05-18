import { cn } from "./component-utils";

export function OrDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-px flex-1 bg-line" />
      <span className="text-caption text-ink-3">or</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}
