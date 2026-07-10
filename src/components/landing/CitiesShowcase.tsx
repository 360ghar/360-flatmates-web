import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { CITIES } from "./landing-data";
import { NetworkImage } from "../ui/NetworkImage";

const CITY_IMAGES: Record<string, string> = {
  Gurugram: "1589829973523-e4ddcbbd40e7",
  Bangalore: "1596176530529-78163a4f7af2",
};

const numberFormatter = new Intl.NumberFormat("en-IN");

export function CitiesShowcase() {
  return (
    <section className="bg-paper py-20 md:py-24 border-b border-line-low" aria-labelledby="cities-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <div className="mb-14 text-center">
          <h2 id="cities-heading" className="text-display max-w-xl mx-auto text-ink">
            Live where you actually want to be.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CITIES.map((city) => (
            <div
              key={city.name}
              className="group relative aspect-[3/4] overflow-hidden rounded-[var(--radius-promo)] border border-line-low bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md md:aspect-[4/3]"
            >
              <NetworkImage
                src={`https://images.unsplash.com/photo-${CITY_IMAGES[city.name] || "1596176530529-78163a4f7af2"}`}
                alt={`${city.name} city view`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
                decoding="async"
                width={800}
                quality={80}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/58 via-transparent to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-80" />

              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/70 bg-surface/94 p-5 text-ink shadow-md backdrop-blur-[9px] transition-all duration-300 group-hover:shadow-hover">
                <div>
                  <h3 className="mb-1.5 text-h1 text-ink">{city.name}</h3>
                  <p className="text-caption font-semibold uppercase tracking-wide text-ink-3" suppressHydrationWarning>
                    {numberFormatter.format(city.listings)} active listings
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action text-action-ink shadow-sm transition-transform duration-300 group-hover:rotate-45 group-hover:bg-accent">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/discover"
            className="text-label-lg text-ink-2 hover:text-accent transition-colors duration-300 border-b border-ink-4 hover:border-accent pb-1"
          >
            Browse all rooms
          </Link>
        </div>
      </div>
    </section>
  );
}
