import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in shaped like the real page. */
export function ChatThreadSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonRoot className={cn(className)}>
      <ChatThreadBones />
    </SkeletonRoot>
  );
}

/** Chat detail: header + messages + composer */
function ChatThreadBones() {
  return (
    <div className="flex h-full min-h-[50vh] flex-col">
      <div className="flex items-center gap-3 border-b border-line px-3 py-3">
        <div className={cn("h-[52px] w-[52px] shrink-0 rounded-cut-md", shimmer)} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className={cn("h-4 w-28 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
        </div>
        <div className="flex gap-2">
          <div className={cn("h-9 w-9 rounded-cut-md", shimmer)} />
          <div className={cn("h-9 w-9 rounded-cut-md", shimmer)} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ChatMessageBones side="left" />
        <ChatMessageBones side="right" />
        <ChatMessageBones side="left" />
        <ChatMessageBones side="right" />
      </div>
      <div className="flex items-center gap-2 border-t border-line px-3 py-3">
        <div className={cn("h-5 w-5 rounded-sm", shimmer)} />
        <div className={cn("h-10 flex-1 rounded-cut-md", shimmer)} />
        <div className={cn("h-8 w-8 rounded-cut-md", shimmer)} />
      </div>
    </div>
  );
}

/** Profile settings page */

/** Matches ChatMessageBubble — left or right */
function ChatMessageBones({ side = "left" }: { side?: "left" | "right" }) {
  const isRight = side === "right";
  return (
    <div className={cn("flex flex-col gap-1", isRight ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-cut-lg p-3",
          isRight ? "rounded-br-sm bg-accent/20" : "rounded-bl-sm bg-surface-strong"
        )}
        style={{ width: "60%" }}
      >
        <div className={cn("h-4 w-3/4 rounded-sm", shimmer)} />
        <div className={cn("mt-1.5 h-3 w-1/2 rounded-sm", shimmer)} />
      </div>
      <div className={cn("h-2.5 w-12 rounded-sm", shimmer)} />
    </div>
  );
}

/**
 * Matches SwipeDeck card — mobile portrait stack, md+ side-by-side, + action bar
 */
