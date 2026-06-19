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
    <section className="bg-surface py-20 md:py-24 border-b border-line-low" aria-labelledby="cities-heading">
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
              className="group relative aspect-[3/4] md:aspect-[4/3] overflow-hidden rounded-3xl bg-surface border border-line-low shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
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
              {/* Image darkening overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent opacity-80 transition-all duration-500 group-hover:opacity-90" />

              {/* Floating Glassmorphic Panel */}
              <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-white/5 backdrop-blur-[12px] border border-white/10 flex items-center justify-between text-white transition-all duration-500 group-hover:bg-white/10 group-hover:border-white/15 shadow-md">
                <div>
                  <h3 className="text-display text-3xl md:text-4xl text-white mb-1.5">{city.name}</h3>
                  <p className="text-label-md text-white/80 tracking-widest uppercase" suppressHydrationWarning>
                    {numberFormatter.format(city.listings)} ACTIVE LISTINGS
                  </p>
                </div>
                <div className="h-11 w-11 shrink-0 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white transition-all duration-300 group-hover:bg-accent group-hover:border-accent group-hover:rotate-45 shadow-sm">
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
            Browse all rooms →
          </Link>
        </div>
      </div>
    </section>
  );
}

