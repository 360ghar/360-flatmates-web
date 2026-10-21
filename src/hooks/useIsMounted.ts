import { useEffect, useRef, type RefObject } from "react";

/** A ref that is true while the component is mounted: guard a late promise before it navigates or toasts. */
export function useIsMounted(): RefObject<boolean> {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}
