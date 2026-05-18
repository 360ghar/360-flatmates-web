import { ArrowUpRight } from "lucide-react";
import { CITIES } from "./landing-data";

const CITY_IMAGES: Record<string, string> = {
  Gurugram: "1567157577867-05ccb1388e66",
  Bangalore: "1596176530529-78163a4f7af2",
};

const numberFormatter = new Intl.NumberFormat("en-IN");

export function CitiesShowcase() {
  return (
    <section className="bg-paper py-20 md:py-24" aria-labelledby="cities-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <div className="mb-14 text-center">
          <p className="text-eyebrow mb-5">Where we're live</p>
          <h2 id="cities-heading" className="text-display max-w-xl mx-auto text-ink">
            Live in the cities that matter
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CITIES.map((city) => (
            <div
              key={city.name}
              className="group relative aspect-[3/4] md:aspect-[4/3] overflow-hidden rounded-3xl bg-surface border border-line-low shadow-sm transition-all duration-700 hover:shadow-xl hover:-translate-y-1"
            >
              <img
                src={`https://images.unsplash.com/photo-${CITY_IMAGES[city.name] || "1596176530529-78163a4f7af2"}?w=800&auto=format&fit=crop&q=80`}
                alt={`${city.name} city view`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-display text-4xl md:text-5xl text-white mb-2">{city.name}</h3>
                    <p className="text-label-md text-white/70 tracking-widest uppercase" suppressHydrationWarning>
                      {numberFormatter.format(city.listings)} ACTIVE LISTINGS
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all duration-300 group-hover:bg-accent group-hover:border-accent group-hover:rotate-45">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button className="text-label-lg text-ink-2 hover:text-accent transition-colors duration-300 border-b border-ink-4 hover:border-accent pb-1">
            More cities dropping soon →
          </button>
        </div>
      </div>
    </section>
  );
}
