import { useCallback, useEffect, useMemo } from "react";
import { useBlocker } from "react-router";

/**
 * Hold navigation while a form is dirty: in-app links, navigate() calls and
 * browser Back all go through the router blocker; tab close and reload get the
 * native beforeunload prompt.
 *
 * Pass `false` for `isDirty` once the form is saved. A navigation that must
 * not be held (the redirect after a save) passes
 * `navigate(to, { state: { skipDirtyGuard: true } })`.
 */
export interface DirtyFormBlocker {
  state: "unblocked" | "blocked" | "proceeding";
  proceed?: () => void;
  reset?: () => void;
  /** Runs a navigation action; the blocker holds it while the form is dirty. */
  confirmNavigation: (action: () => void) => boolean;
}

export function useDirtyFormGuard(isDirty: boolean, message: string): DirtyFormBlocker {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, message]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      currentLocation.pathname !== nextLocation.pathname &&
      !(nextLocation.state as { skipDirtyGuard?: boolean } | null)?.skipDirtyGuard
  );

  const confirmNavigation = useCallback((action: () => void) => {
    action();
    return !isDirty;
  }, [isDirty]);

  return useMemo(
    () => ({
      state: blocker.state,
      proceed: blocker.proceed,
      reset: blocker.reset,
      confirmNavigation
    }),
    [blocker.state, blocker.proceed, blocker.reset, confirmNavigation]
  );
}
