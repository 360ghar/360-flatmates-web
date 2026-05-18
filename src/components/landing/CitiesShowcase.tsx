import { ArrowUpRight } from "lucide-react";
import { CITIES } from "./landing-data";

const CITY_IMAGES: Record<string, string> = {
  Gurugram: "1567157577867-05ccb1388e66",
  Bangalore: "1596176530529-78163a4f7af2",
  // "Delhi NCR": "1567157577867-05ccb1388e66",
  // Mumbai: "1566552881560-0be862a7c445",
  // Pune: "1512918728675-ed5a9ecdebfd",
  // Hyderabad: "1514362545857-3bc16c4c7d1b",
  // Chennai: "1582510003544-4d00b7f74220",
  // Ahmedabad: "1507676184212-d03ab07a01bf",
  // Kolkata: "1585409677983-0f6c41ca9c3b",
};

const numberFormatter = new Intl.NumberFormat("en-IN");

export function CitiesShowcase() {
  return (
    <section className="bg-paper py-20 md:py-24" aria-labelledby="cities-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <div className="mb-14">
          <p className="text-eyebrow mb-5">Network</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h2 id="cities-heading" className="text-display max-w-2xl text-ink">
              Expanding across India&apos;s most vibrant hubs
            </h2>
            <p className="max-w-[35ch] text-body-lg text-ink-3">
              Direct access to verified listings in premier cities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {CITIES.map((city) => (
            <div key={city.name} className={`group relative aspect-[3/4] overflow-hidden rounded-3xl bg-surface border border-line-low shadow-sm transition-all duration-700 hover:shadow-xl hover:-translate-y-2`}>
                <img
                  src={`https://images.unsplash.com/photo-${CITY_IMAGES[city.name] || "1596176530529-78163a4f7af2"}?w=800&auto=format&fit=crop&q=80`}
                  alt={`${city.name} city view`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h1 text-white text-3xl mb-0.5">{city.name}</h3>
                    <p className="text-label-md text-white/70 tracking-widest uppercase" suppressHydrationWarning>
                      {numberFormatter.format(city.listings)} ACTIVE LISTINGS
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all duration-300 group-hover:bg-accent group-hover:border-accent group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-14 flex justify-center">
          <button className="text-label-lg text-ink-2 hover:text-accent transition-colors duration-300 border-b border-ink-4 hover:border-accent pb-1">
            More cities coming soon
          </button>
        </div>
      </div>
    </section>
  );
}
