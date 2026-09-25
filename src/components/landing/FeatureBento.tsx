import { RevealSection } from "@/components/ui/RevealSection";
import { cn } from "@/components/ui/component-utils";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { BENTO_FEATURES, type BentoFeatureItem } from "./landing-data";

/* 5-cell asymmetric bento. The 6-dimension story moved to CompatibilitySection,
   so this grid leads the supporting features. Cells fill a 4-col grid exactly
   (2+1+1 / 2+2), and background treatments vary: one photo cell, two gradient
   cells, two plain cells, so it never reads as white-on-white. */

function spanClasses(span: BentoFeatureItem["span"]): string {
  return span === "wide"
    ? "md:col-span-2 lg:col-span-2"
    : "md:col-span-1 lg:col-span-1";
}

function FeatureCard({ feature }: { feature: BentoFeatureItem }) {
  const Icon = feature.icon;

  if (feature.variant === "image") {
    return (
      <div className="bento-card group relative h-full min-h-[240px] overflow-hidden !p-0">
        <NetworkImage
          src={`https://images.unsplash.com/photo-${feature.image}`}
          alt=""
          aria-hidden="true"
          className="transition-transform duration-700 ease-out group-hover:scale-105"
          width={600}
          quality={75}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/10" />
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
          <h3 className="text-h3 text-white mb-2">{feature.title}</h3>
          <p className="text-body-md text-white/85 leading-relaxed">{feature.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bento-card paper-grain relative flex h-full min-h-[200px] flex-col overflow-hidden",
        feature.variant === "gradient" && "!bg-paper-1"
      )}
    >
      <div className="relative flex h-full flex-col gap-4">
        <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-h3 text-ink mb-2">{feature.title}</h3>
          <p className="text-body-md leading-relaxed text-ink-2">{feature.description}</p>
        </div>
        {feature.tags && (
          <p className="mt-auto text-label-md text-ink-2">{feature.tags.join(" · ")}</p>
        )}
      </div>
    </div>
  );
}

export function FeatureBento() {
  return (
    <section
      className="overflow-hidden"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-12 md:py-28">
        <RevealSection className="mb-14 max-w-2xl">
          <h2 id="features-heading" className="text-display text-ink leading-tight [text-wrap:balance]">
            Move in with confidence.
          </h2>
          <p className="mt-5 max-w-xl text-body-lg text-ink-2 [text-wrap:pretty]">
            From verified rooms to context-rich chat, the boring parts are handled so you can focus on the fit.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {BENTO_FEATURES.map((feature, idx) => (
            <RevealSection
              key={feature.title}
              className={spanClasses(feature.span)}
              staggerIndex={(idx % 6) + 1}
            >
              <FeatureCard feature={feature} />
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
