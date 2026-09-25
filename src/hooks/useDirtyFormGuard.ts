import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

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

  // Also guard in-app links (sidebar, bottom nav, any <a>) while dirty (W13):
  // intercept same-origin link clicks in the capture phase, before React Router
  // handles them, and route them through the same confirm modal.
  const navigate = useNavigate();
  useEffect(() => {
    if (!isDirty) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      pendingActionRef.current = () => navigate(url.pathname + url.search + url.hash);
      setState("blocked");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isDirty, navigate]);

  const effectiveState = !isDirty && state === "blocked" ? "unblocked" : state;

  // ponytail: browser Back is not intercepted. BrowserRouter has no useBlocker;
  // moving to a data router (createBrowserRouter) would cover it.
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
