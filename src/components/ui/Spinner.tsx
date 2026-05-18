import { cn } from "./component-utils";

export interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-accent border-t-transparent",
        sizeClasses[size],
        className,
      )}
    />
  );
}

export function PageSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-paper",
        className,
      )}
    >
      <Spinner />
    </div>
  );
}
