import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { CITIES } from "./landing-data";
import { NetworkImage } from "../ui/NetworkImage";

const CITY_IMAGES: Record<string, string> = {
  Gurugram: "1589829973523-e4ddcbbd40e7",
  Bangalore: "1596176530529-78163a4f7af2",
};

export function CitiesShowcase() {
  return (
    <section className="py-20 md:py-24" aria-labelledby="cities-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <h2 id="cities-heading" className="text-display mb-10 max-w-[18ch] text-ink">
          Live where you actually want to be.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CITIES.map((city) => (
            <Link
              key={city.name}
              to={`/cities/${city.name.toLowerCase()}`}
              className="paper-lift group relative block aspect-[3/4] overflow-hidden rounded-hand bg-surface shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:aspect-[4/3]"
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

              <div className="paper-grain absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-hand bg-surface px-5 py-4 text-ink shadow-md">
                <div>
                  <h3 className="text-h1 text-ink">{city.name}</h3>
                  <p className="text-body-md text-ink-2">Browse rooms and flatmates</p>
                </div>
                <ArrowUpRight className="h-6 w-6 shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link to="/discover" className="text-body-md font-semibold text-accent underline-offset-4 hover:underline">
            Browse all rooms
          </Link>
        </div>
      </div>
    </section>
  );
}
