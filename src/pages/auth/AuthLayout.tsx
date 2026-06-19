import { Link, Outlet } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { focusRing } from "@/components/ui/component-utils";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-5 py-12 pt-[calc(48px+env(safe-area-inset-top))] pb-[calc(48px+env(safe-area-inset-bottom))] overflow-hidden">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square rounded-full bg-accent/5 blur-[100px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square rounded-full bg-accent/8 blur-[100px] pointer-events-none animate-pulse duration-[8000ms]" />

      {/* Back button at top-left */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className={`inline-flex items-center gap-1.5 rounded-[9px] text-label-md text-ink-3 hover:text-accent transition-colors duration-200 ${focusRing}`}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to home
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm hover:shadow-md transition-all duration-300">
        {/* Brand Logo Header */}
        <div className="flex justify-center mb-8">
          <Logo className="scale-105" />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
