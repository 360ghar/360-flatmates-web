import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FullPageMessage } from "@/components/ui/FullPageMessage";
import { debug } from "@/lib/debug";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  componentStack?: string;
  reset: () => void;
}

export function ErrorFallback({ error, componentStack, reset }: ErrorFallbackProps) {
  // Log on mount so the error is always visible in the console
  useEffect(() => {
    debug.dumpError("ErrorFallback", "Page crashed", error);
    if (componentStack) {
      debug.error("ErrorFallback", "Component stack:", componentStack);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  const isDev = import.meta.env.DEV;

  return (
    <FullPageMessage
      icon={<TriangleAlert aria-hidden className="size-12" />}
      title="Something went wrong"
      description="We are having trouble loading this page. Please try again."
      action={
        <>
          <Button
            onClick={reset}
            leadingIcon={<RotateCcw aria-hidden className="size-4" />}
          >
            Try Again
          </Button>

          {/* Show error details in dev mode for easier debugging */}
          {isDev && (
            <details className="mt-6 max-w-lg text-left">
              <summary className="cursor-pointer text-sm text-ink-3 hover:text-ink-2">
                Error details (dev only)
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-surface-raised p-4 text-xs text-error">
                <strong>{error.name}: {error.message}</strong>
                {error.digest && <span className="block mt-1 text-ink-3">Digest: {error.digest}</span>}
                {error.stack && (
                  <code className="block mt-2 whitespace-pre-wrap text-[11px] leading-relaxed">
                    {error.stack}
                  </code>
                )}
                {componentStack && (
                  <>
                    <strong className="block mt-3">Component Stack:</strong>
                    <code className="block mt-1 whitespace-pre-wrap text-[11px] leading-relaxed">
                      {componentStack}
                    </code>
                  </>
                )}
              </pre>
            </details>
          )}
        </>
      }
    />
  );
}
