import type { ReactNode } from "react";
import { Link } from "react-router";
import { CityArt, type CityArtName } from "@/components/paper/CityArt";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

/**
 * A city or area header: breadcrumbs, the title, one line and one action on a
 * paper band, with the city's cut-paper skyline pinned on a tilted sheet.
 */
export function PlaceHero({
  crumbs,
  title,
  lead,
  city,
  action
}: {
  crumbs: ReadonlyArray<Crumb>;
  title: string;
  lead: string;
  city: CityArtName;
  action?: ReactNode;
}) {
  return (
    <section aria-labelledby="place-heading" className="paper-edge-torn-bottom paper-grain bg-paper-1 pb-[calc(var(--torn-depth)+40px)] pt-6 md:pb-[calc(var(--torn-depth)+56px)] md:pt-10">
      <div className="page-container grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Breadcrumbs items={crumbs} />
          <h1 id="place-heading" className="mt-3 text-display max-w-[16ch] text-ink">
            {title}
          </h1>
          <p className="mt-4 max-w-[52ch] text-body-lg text-ink-2">{lead}</p>
          {action ? <div className="mt-7">{action}</div> : null}
        </div>
        <div className="lg:col-span-6">
          <div className="paper-grain mx-auto max-w-[520px] rotate-[1.2deg] overflow-hidden rounded-hand bg-surface p-2 shadow-md">
            <CityArt city={city} className="rounded-cut-md" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Area links as a grid of paper tabs. */
export function AreaLinks({ citySlug, areas }: { citySlug: string; areas: ReadonlyArray<{ slug: string; name: string; blurb?: string }> }) {
  return (
    <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))]">
      {areas.map((area) => (
        <li key={area.slug}>
          <Link
            to={`/cities/${citySlug}/${area.slug}`}
            className="paper-grain paper-lift flex min-h-16 flex-col justify-center rounded-hand bg-surface px-4 py-3 shadow-xs transition-[transform,box-shadow] duration-200 hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="text-h3 text-ink">{area.name}</span>
            <span className="text-caption text-ink-3">Rooms and flatmates</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const FACTS = [
  { title: "Checked before it is live", body: "Every listing is reviewed first: real photos, real rent, real dates." },
  { title: "Matched on daily life", body: "Sleep, tidiness, food, guests and work count as much as budget." },
  { title: "Your number stays yours", body: "Chat and book visits in the app. Share your phone only when you choose." }
];

/** Three plain facts about how the app works, no badges. */
export function TrustFacts() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {FACTS.map((fact) => (
        <div key={fact.title}>
          <h3 className="text-h3 text-ink">{fact.title}</h3>
          <p className="mt-1.5 max-w-[36ch] text-body-lg text-ink-2">{fact.body}</p>
        </div>
      ))}
    </div>
  );
}
