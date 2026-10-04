import { Outlet } from "react-router";
import { X } from "lucide-react";
import { PaperScene } from "@/components/paper/PaperScene";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { OfflineBanner, PageChromeContext, useBack } from "@/components/ui/Layout";
import { useRouteHandle } from "@/hooks/useRouteHandle";

/**
 * One task at a time (post a listing, onboarding, role, location): no tab bar
 * or sidebar to wander off to. Close appears when the route has somewhere to
 * return to; the onboarding gate has none. The neighbourhood ends the page.
 */
export function FocusLayout() {
  const handle = useRouteHandle();
  const close = useBack(handle.back);

  return (
    <div className="flex min-h-dvh flex-col bg-sky text-ink">
      <OfflineBanner />
      <header className="page-container flex h-16 shrink-0 items-center justify-between pt-[env(safe-area-inset-top)]">
        <Logo compact />
        {handle.back ? (
          <Button aria-label="Close" size="icon" variant="icon" onClick={close}>
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        ) : null}
      </header>
      <main id="main" className="relative z-10 mx-auto w-full max-w-[680px] flex-1 px-[var(--gutter)] pb-10 pt-2">
        <PageChromeContext.Provider value={{}}>
          <Outlet />
        </PageChromeContext.Provider>
      </main>
      <PaperScene className="h-[180px] shrink-0 md:h-[220px]" torn={false} />
    </div>
  );
}
