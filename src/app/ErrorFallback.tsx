import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
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
      title="Something went wrong"
      description="This page could not load. Try again, or go back to the page you came from."
      action={
        <>
          <Button
            onClick={reset}
            leadingIcon={<RotateCcw aria-hidden className="size-4" />}
          >
            Try again
          </Button>

          {/* Show error details in dev mode for easier debugging */}
          {isDev && (
            <details className="mt-6 max-w-lg text-left">
              <summary className="cursor-pointer text-body-md text-ink-3 hover:text-ink-2">
                Error details (dev only)
              </summary>
              <pre className="mt-2 overflow-auto rounded-cut-md bg-paper-3 p-4 text-caption text-danger">
                <strong>{error.name}: {error.message}</strong>
                {error.digest && <span className="block mt-1 text-ink-3">Digest: {error.digest}</span>}
                {error.stack && (
                  <code className="block mt-2 whitespace-pre-wrap text-caption">
                    {error.stack}
                  </code>
                )}
                {componentStack && (
                  <>
                    <strong className="block mt-3">Component Stack:</strong>
                    <code className="block mt-1 whitespace-pre-wrap text-caption">
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
