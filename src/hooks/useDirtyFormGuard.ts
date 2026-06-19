import { useCallback, useEffect } from "react";
import { useBlocker, type BlockerFunction } from "react-router";

/**
 * Block in-app navigation and warn on browser tab close / reload while a form
 * is dirty. Mirrors the pattern used in ProfileEditPage so all multi-field
 * forms share the same guard UX.
 *
 * Pass `false` for `isDirty` once the form has been successfully saved (or
 * while a save is in flight) so the guard doesn't fire on the post-save nav.
 */
export function useDirtyFormGuard(isDirty: boolean, message: string) {
  const blocker = useBlocker(
    useCallback<BlockerFunction>(
      ({ currentLocation, nextLocation }) =>
        isDirty && currentLocation.pathname !== nextLocation.pathname,
      [isDirty]
    )
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, message]);

  return blocker;
}
