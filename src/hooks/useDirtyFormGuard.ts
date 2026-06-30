import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Block in-app navigation and warn on browser tab close / reload while a form
 * is dirty. Mirrors the pattern used in ProfileEditPage so all multi-field
 * forms share the same guard UX.
 *
 * Pass `false` for `isDirty` once the form has been successfully saved (or
 * while a save is in flight) so the guard doesn't fire on the post-save nav.
 */
interface DirtyFormBlocker {
  state: "unblocked" | "blocked" | "proceeding";
  proceed?: () => void;
  reset?: () => void;
  confirmNavigation: (action: () => void) => boolean;
}

export function useDirtyFormGuard(isDirty: boolean, message: string): DirtyFormBlocker {
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [state, setState] = useState<DirtyFormBlocker["state"]>("unblocked");

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, message]);

  const reset = useCallback(() => {
    pendingActionRef.current = null;
    setState("unblocked");
  }, []);

  const proceed = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setState("proceeding");
    action?.();
    setState("unblocked");
  }, []);

  const confirmNavigation = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action();
        return true;
      }
      pendingActionRef.current = action;
      setState("blocked");
      return false;
    },
    [isDirty]
  );

  const effectiveState = !isDirty && state === "blocked" ? "unblocked" : state;

  // `useBlocker` only works reliably in React Router data routers. This app
  // currently uses BrowserRouter, so callers opt into modal-backed blocking for
  // explicit cancel/back actions via `confirmNavigation`.
  return useMemo(
    () => ({
      state: effectiveState,
      proceed,
      reset,
      confirmNavigation,
    }),
    [confirmNavigation, effectiveState, proceed, reset]
  );
}
