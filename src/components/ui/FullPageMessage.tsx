import type { ReactNode } from "react";
import { PaperMiniScene, type PaperProp } from "@/components/paper/PaperScene";
import { cn } from "./component-utils";

export interface FullPageMessageProps {
  /** Prop in the small paper scene (DESIGN.md §6). */
  scene?: PaperProp;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/** A whole-page state (not found, error, maintenance): the small scene, a line and one way on. */
export function FullPageMessage({ scene = "rainCloud", title, description, action, className }: FullPageMessageProps) {
  return (
    <div className={cn("grid min-h-[60vh] place-items-center px-[var(--gutter)] py-16 text-ink", className)}>
      <section className="page-fade flex max-w-md flex-col items-center text-center">
        <PaperMiniScene prop={scene} className="w-[70%] max-w-[240px]" />
        <h1 className="mt-6 text-h1 text-ink">{title}</h1>
        <p className="mt-3 text-body-lg text-ink-2">{description}</p>
        {action ? <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div> : null}
      </section>
    </div>
  );
}
