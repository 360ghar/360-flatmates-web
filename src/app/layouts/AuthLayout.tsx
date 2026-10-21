import { Link, Outlet, useLocation } from "react-router";
import { ArrowLeft } from "lucide-react";
import { PaperScene } from "@/components/paper/PaperScene";
import { Logo } from "@/components/ui/Logo";
import { focusRing } from "@/components/ui/component-utils";

/* Auth pages: the neighbourhood rests along the bottom of the sky and the
   form is one raised sheet above it. */
export function AuthLayout() {
  // Adding a phone finishes sign-up; leaving for the landing page there strands the account.
  const midSignup = useLocation().pathname === "/add-phone";
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-sky px-[var(--gutter)] py-12 pb-[calc(48px+env(safe-area-inset-bottom))] pt-[calc(72px+env(safe-area-inset-top))]">
      <PaperScene className="!absolute inset-x-0 bottom-0 h-[42vh] min-h-[260px]" torn={false} />

      {midSignup ? null : (
      <div className="absolute left-[var(--gutter)] top-[calc(16px+env(safe-area-inset-top))] z-[var(--z-raised)]">
        <Link
          to="/"
          className={`inline-flex min-h-[var(--touch-min)] items-center gap-1.5 rounded-cut-md px-3 text-body-md font-semibold text-ink-2 transition-colors duration-200 hover:bg-surface-soft hover:text-ink ${focusRing}`}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to home
        </Link>
      </div>
      )}

      <main id="main" className="paper-grain relative z-[var(--z-raised)] w-full max-w-md rounded-hand bg-surface-elevated p-6 shadow-md sm:p-8">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
