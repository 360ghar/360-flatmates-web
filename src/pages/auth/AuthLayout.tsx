import { Link, Outlet } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { focusRing } from "@/components/ui/component-utils";

export function AuthLayout() {
  return (
    <div className="map-grid-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-12 pb-[calc(48px+env(safe-area-inset-bottom))] pt-[calc(48px+env(safe-area-inset-top))]">
      <div className="absolute inset-x-0 top-0 h-24 border-b border-line-low bg-surface/70 backdrop-blur-xl" aria-hidden="true" />

      <div className="absolute left-5 top-6 z-[var(--z-raised)] md:left-8">
        <Link
          to="/"
          className={`inline-flex min-h-[var(--touch-min)] items-center gap-1.5 rounded-[9px] border border-line-low bg-surface/90 px-3 text-label-md text-ink-2 shadow-xs backdrop-blur transition-colors duration-200 hover:border-accent/25 hover:text-accent ${focusRing}`}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to home
        </Link>
      </div>

      <div className="relative z-[var(--z-raised)] w-full max-w-md rounded-[var(--radius-promo)] border border-line-low bg-surface p-6 shadow-md transition-shadow duration-300 hover:shadow-lg sm:p-8">
        <div className="flex justify-center mb-8">
          <Logo className="scale-105" />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
