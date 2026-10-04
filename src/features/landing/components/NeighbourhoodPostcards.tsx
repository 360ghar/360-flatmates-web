import { Link } from "react-router";
import { CityArt, type CityArtName } from "@/components/paper/CityArt";
import { cn, focusRing } from "@/components/ui/component-utils";
import { getNeighborhoodsForCity } from "@/lib/seo/neighborhoods";

const POSTCARDS: ReadonlyArray<{ slug: CityArtName; name: string; pin: string; line: string; tilt: string }> = [
  { slug: "bangalore", name: "Bangalore", pin: "560 034", line: "Rooftop flats close to the tech parks.", tilt: "md:-rotate-[1.2deg]" },
  { slug: "gurugram", name: "Gurugram", pin: "122 002", line: "Tower flats between Cyber City and Golf Course Road.", tilt: "md:rotate-[1deg] md:translate-y-8" }
];

/** Two cities as paper postcards: the skyline, a stamp, and real areas to browse. */
export function NeighbourhoodPostcards() {
  return (
    <section aria-labelledby="cities-heading" className="page-container py-[72px] md:py-24">
      <h2 id="cities-heading" className="text-display max-w-[18ch] text-ink">
        Pick a neighbourhood.
      </h2>
      <p className="mt-4 max-w-[48ch] text-body-lg text-ink-2">We are live in two cities. Start with an area you already know.</p>

      <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-10">
        {POSTCARDS.map((card) => {
          const areas = getNeighborhoodsForCity(card.slug).slice(0, 6);
          return (
            <article
              key={card.slug}
              aria-labelledby={`card-${card.slug}`}
              className={cn(
                "paper-grain paper-lift overflow-hidden rounded-hand bg-surface shadow-md transition-[transform,box-shadow] duration-200 ease-[var(--ease-paper-out)]",
                card.tilt
              )}
            >
              <CityArt city={card.slug} className="aspect-[12/5] object-cover" />
              <div className="flex items-start justify-between gap-4 px-6 pt-5">
                <div className="min-w-0">
                  <h3 id={`card-${card.slug}`} className="text-h1 text-ink">
                    <Link to={`/cities/${card.slug}`} className={cn("rounded-cut-sm hover:text-clay", focusRing)}>
                      {card.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-body-md text-ink-2">{card.line}</p>
                </div>
                {/* Postage stamp with the city's PIN code. */}
                <div aria-hidden="true" className="mt-1 shrink-0 rotate-3 [filter:drop-shadow(1px_2px_1.5px_rgb(35_32_28/0.2))]">
                  <div className="paper-edge-perforated grid h-[78px] w-[64px] place-items-center bg-paper-3 p-2">
                    <div className="grid h-full w-full place-items-center rounded-[2px] bg-clay-soft text-center">
                      <span className="font-display text-[20px] leading-none text-clay">360</span>
                      <span className="text-[10px] font-semibold tabular-nums leading-none text-ink-2">{card.pin}</span>
                    </div>
                  </div>
                </div>
              </div>
              <ul className="grid grid-cols-2 gap-x-4 px-4 pb-5 pt-3" aria-label={`Areas in ${card.name}`}>
                {areas.map((area) => (
                  <li key={area.slug}>
                    <Link
                      to={`/cities/${card.slug}/${area.slug}`}
                      className={cn("flex min-h-11 items-center rounded-cut-md px-2 text-body-lg text-ink-2 hover:bg-surface-soft hover:text-ink", focusRing)}
                    >
                      {area.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
