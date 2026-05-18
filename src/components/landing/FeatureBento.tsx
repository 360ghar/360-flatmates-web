import { RevealSection } from "@/components/ui/RevealSection";
import { BENTO_FEATURES, DIMENSIONS } from "./landing-data";

export function FeatureBento() {
  const heroFeature = BENTO_FEATURES.find((f) => f.span === "hero")!;
  const otherFeatures = BENTO_FEATURES.filter((f) => f.span !== "hero");

  return (
    <section
      className="bg-paper overflow-hidden"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-12 md:py-28">
        <RevealSection className="text-center mb-14">
          <p className="text-eyebrow mb-5">Why 360 Flatmates</p>
          <h2 id="features-heading" className="text-display max-w-2xl mx-auto text-ink">
            Compatibility &gt; just budget &amp; location
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-body-lg text-ink-3">
            We match on the stuff that actually makes or breaks living together.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Hero card — 2 cols × 2 rows on lg */}
          <RevealSection className="md:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="bento-card h-full p-6 md:p-8 bg-gradient-to-br from-accent-soft to-surface border-accent/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent mb-5">
                <heroFeature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-h1 text-2xl md:text-3xl text-ink mb-3">{heroFeature.title}</h3>
              <p className="text-body-lg text-ink-3 mb-8">{heroFeature.description}</p>
              <div className="grid grid-cols-3 gap-3">
                {DIMENSIONS.map((dim) => {
                  const DimIcon = dim.icon;
                  return (
                    <div
                      key={dim.label}
                      className={`flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-300 hover:scale-[1.04] ${dim.tint} bg-surface border border-line-low`}
                    >
                      <DimIcon className="h-4 w-4" />
                      <span className="text-label-md">{dim.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </RevealSection>

          {/* Other cards */}
          {otherFeatures.map((feature) => {
            const FeatureIcon = feature.icon;
            const isWide = feature.span === "wide";
            return (
              <RevealSection
                key={feature.title}
                className={isWide ? "md:col-span-2 lg:col-span-2" : "md:col-span-1 lg:col-span-1"}
              >
                <div className="bento-card h-full p-6 flex flex-col gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${feature.tint} bg-surface`}>
                    <FeatureIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-h3 text-ink mb-2">{feature.title}</h3>
                    <p className="text-body-md text-ink-3 leading-relaxed">{feature.description}</p>
                  </div>
                  {feature.tags && (
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {feature.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line-low px-3 py-1 text-label-md text-ink-2"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </RevealSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
