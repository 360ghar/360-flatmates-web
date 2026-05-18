import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FullPageMessage } from "@/components/ui/FullPageMessage";

export function ErrorFallback({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <FullPageMessage
      icon={<TriangleAlert aria-hidden className="size-12" />}
      title="Something went wrong"
      description="We are having trouble loading this page. Please try again."
      action={
        <Button
          onClick={reset}
          leadingIcon={<RotateCcw aria-hidden className="size-4" />}
        >
          Try Again
        </Button>
      }
    />
  );
}
