import { PaperMiniScene, type PaperProp } from "@/components/paper/PaperScene";
import { cn } from "@/components/ui/component-utils";
import { STEPS } from "./landing-data";

/* Three paper sheets laid on the table in reading order. The slight tilt and
   overlap carry the sequence, so there are no step numbers or rails. */
const SHEETS: ReadonlyArray<{ prop: PaperProp; tilt: string }> = [
  { prop: "heart", tilt: "md:-rotate-[1.2deg]" },
  { prop: "chat", tilt: "md:rotate-[0.8deg] md:translate-y-6" },
  { prop: "house", tilt: "md:-rotate-[0.6deg]" }
];

export function HowItWorks() {
  return (
    <section className="px-5 pb-20 pt-24 md:px-12 md:pb-28 md:pt-32" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="how-it-works-heading" className="text-display max-w-[18ch] text-ink">
          From first search to first visit.
        </h2>

        <ol className="mt-12 grid gap-5 md:grid-cols-3 md:gap-0">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={cn(
                "paper-grain rounded-hand bg-surface p-6 shadow-md md:-mx-1",
                SHEETS[index]?.tilt
              )}
            >
              <PaperMiniScene prop={SHEETS[index]?.prop ?? "house"} className="max-w-[200px]" />
              <h3 className="mt-5 text-h3 text-ink">{step.title}</h3>
              <p className="mt-2 text-body-md text-ink-2">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
