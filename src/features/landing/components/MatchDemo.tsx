import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { calculateCompatibility } from "@/lib/compatibility";
import type { CompatibilityProfile } from "@/lib/compatibility";
import type { Cleanliness, GuestsPolicy, SleepSchedule } from "@/lib/data";
import { ChoiceChips, type ChoiceOption } from "@/components/ui/ChoiceChips";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { buttonClasses, cn } from "@/components/ui/component-utils";

const SLEEP: ReadonlyArray<ChoiceOption<SleepSchedule>> = [
  { value: "early_bird", label: "Early bird" },
  { value: "flexible", label: "Flexible" },
  { value: "night_owl", label: "Night owl" }
];
const CLEAN: ReadonlyArray<ChoiceOption<Cleanliness>> = [
  { value: "minimal", label: "Relaxed" },
  { value: "tidy", label: "Tidy" },
  { value: "spotless", label: "Spotless" }
];
const GUESTS: ReadonlyArray<ChoiceOption<GuestsPolicy>> = [
  { value: "no_overnight_guests", label: "Rarely" },
  { value: "occasional_ok", label: "Sometimes" },
  { value: "open_house", label: "Often" }
];

/* The example flatmate. Food, smoking, drinking and work are shared with the
   visitor, so the three questions move the score and nothing else does. */
const FLATMATE: Required<Omit<CompatibilityProfile, "id">> = {
  sleep_schedule: "flexible",
  cleanliness: "tidy",
  guests_policy: "occasional_ok",
  food_habits: "vegetarian",
  smoking: "never",
  drinking: "occasionally",
  work_style: "hybrid"
};

const FLATMATE_TRAITS = ["Flexible hours", "Tidy", "Guests sometimes", "Vegetarian", "Works hybrid"];

const ROW_LABEL: Record<string, string> = {
  sleep_schedule: "Sleep",
  cleanliness: "Tidiness",
  guests_policy: "Guests"
};

type Verdict = { label: string; tone: string };
function verdict(score: number): Verdict {
  if (score >= 90) return { label: "Same page", tone: "text-pine" };
  if (score >= 60) return { label: "Easy to work out", tone: "text-ink-2" };
  return { label: "Worth a chat first", tone: "text-clay" };
}

function Score({ value }: { value: number }) {
  const count = useMotionValue(value);
  const rounded = useTransform(count, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(count, value, { type: "spring", stiffness: 140, damping: 22 });
    return () => controls.stop();
  }, [count, value]);

  return (
    <div className="paper-grain relative grid size-[120px] place-items-center rounded-full bg-paper-3 shadow-md">
      <ProgressRing value={value} size="xl" showValue={false} label="Example compatibility score" className="absolute size-[96px]" />
      <span className="relative flex items-baseline text-ink" aria-hidden="true">
        <motion.span className="text-h1 tabular-nums">{rounded}</motion.span>
        <span className="ml-0.5 text-h3">%</span>
      </span>
    </div>
  );
}

/** "How do you live?": three answers, scored live by the app's real engine. */
export function MatchDemo() {
  const [sleep, setSleep] = useState<SleepSchedule>("early_bird");
  const [clean, setClean] = useState<Cleanliness>("tidy");
  const [guests, setGuests] = useState<GuestsPolicy>("occasional_ok");

  const result = useMemo(
    () => calculateCompatibility({ ...FLATMATE, sleep_schedule: sleep, cleanliness: clean, guests_policy: guests }, FLATMATE),
    [sleep, clean, guests]
  );
  const score = result.overall_percentage;
  const rows = result.dimensions.filter((d) => d.name === "sleep_schedule" || d.name === "cleanliness" || d.name === "guests_policy");
  const answersKey = `${sleep}-${clean}-${guests}`;

  return (
    <section aria-labelledby="match-heading" className="page-container grid gap-12 py-[72px] md:py-24 lg:grid-cols-12 lg:items-center lg:gap-10">
      <div className="lg:col-span-5">
        <h2 id="match-heading" className="text-display max-w-[14ch] text-ink">
          How do you live?
        </h2>
        <p className="mt-4 max-w-[46ch] text-body-lg text-ink-2">
          Answer three questions. The score comes from the same engine the app uses to rank people for you.
        </p>

        <div className="mt-8 flex flex-col gap-6">
          <fieldset>
            <legend className="mb-2.5 text-label-lg text-ink">When do you sleep?</legend>
            <ChoiceChips label="When do you sleep?" options={SLEEP} value={sleep} onValueChange={setSleep} />
          </fieldset>
          <fieldset>
            <legend className="mb-2.5 text-label-lg text-ink">How tidy is your space?</legend>
            <ChoiceChips label="How tidy is your space?" options={CLEAN} value={clean} onValueChange={setClean} />
          </fieldset>
          <fieldset>
            <legend className="mb-2.5 text-label-lg text-ink">How often do friends stay over?</legend>
            <ChoiceChips label="How often do friends stay over?" options={GUESTS} value={guests} onValueChange={setGuests} />
          </fieldset>
        </div>

        <Link to="/discover" className={cn(buttonClasses("primary"), "mt-10")}>
          Start matching
        </Link>
      </div>

      {/* Two profile sheets on the table, the score pinned across both. */}
      <figure className="relative mx-auto w-full max-w-[560px] lg:col-span-7 lg:max-w-none lg:pl-8">
        <figcaption className="sr-only">
          Example: your answers compared with a flatmate in Koramangala. Score {score} percent.
        </figcaption>
        <div className="relative pb-6 pt-2 sm:pl-10">
          <motion.div
            key={`them-${answersKey}`}
            initial={{ rotate: 2.6 }}
            animate={{ rotate: 1.6 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="paper-grain relative rounded-hand bg-surface p-6 pb-10 shadow-sm sm:ml-16 sm:p-7 sm:pb-16"
          >
            <p className="text-caption text-ink-3">Example flatmate</p>
            <p className="mt-1 text-h2 text-ink">Koramangala, 27</p>
            <p className="mt-1 text-body-md text-ink-2">Product designer, room from June</p>
            <p className="mt-4 max-w-[36ch] text-body-md text-ink-2">{FLATMATE_TRAITS.join(", ")}.</p>
          </motion.div>

          <motion.div
            key={`you-${answersKey}`}
            initial={{ rotate: -2.4, y: 4 }}
            animate={{ rotate: -1.4, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="paper-grain relative -mt-6 rounded-hand bg-paper-3 p-6 shadow-md sm:-mt-10 sm:mr-16 sm:p-7"
          >
            <p className="text-caption text-ink-3">You</p>
            <ul className="mt-3 flex flex-col gap-3" aria-label="How your answers compare">
              {rows.map((row) => {
                const v = verdict(row.score);
                return (
                  <li key={row.name} className="flex items-center justify-between gap-4">
                    <span className="text-body-md text-ink">{ROW_LABEL[row.name]}</span>
                    <span className={cn("text-label-md", v.tone)}>{v.label}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 text-caption text-ink-3">Food, smoking, drinking and work count too. Here they already match.</p>
          </motion.div>

          <div className="absolute -top-4 right-2 sm:right-6 lg:-right-2">
            <Score value={score} />
          </div>
        </div>
      </figure>
    </section>
  );
}
