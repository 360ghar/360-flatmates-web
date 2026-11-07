import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FaqList } from "@/components/ui/FaqList";
import { PageBand } from "@/components/ui/Layout";
import {
  bestPageJsonLd,
  CHECKED_ON,
  PUBLISHER_LINE,
  sourceLabels,
  type BestPage as BestPageData,
} from "@/features/places/lib/best-pages";

/** A "best X" page. The copy and sources come from best-pages.ts, the same data the static HTML uses. */
export function BestPage({ page }: { page: BestPageData }) {
  return (
    <>
      <SeoHelmet
        title={page.title}
        description={page.description}
        canonicalUrl={`${SITE_URL}/${page.slug}`}
        jsonLd={bestPageJsonLd(page)}
      />

      <PageBand
        title={page.title}
        description={page.answer.join(" ")}
        above={<Breadcrumbs items={[{ label: "Home", to: "/" }, { label: page.title }]} />}
      />

      <div className="page-container page-fade flex flex-col gap-16 py-12 md:py-16">
        <section aria-label="Publisher and date" className="w-full max-w-[860px]">
          <p className="text-body-lg text-ink-2">{PUBLISHER_LINE}</p>
          <p className="mt-2 text-caption text-ink-3">
            Checked on <time dateTime={CHECKED_ON}>{CHECKED_ON}</time>. Each fact links to the product&apos;s own website.
          </p>
        </section>

        <section aria-labelledby="ranked-heading" className="w-full max-w-[860px]">
          <h2 id="ranked-heading" className="text-h2 text-ink">Ranked list</h2>
          <div className="paper-grain mt-6 overflow-x-auto rounded-hand bg-surface shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-paper-1">
                  <th scope="col" className="p-4 text-label-lg text-ink-3">Rank</th>
                  <th scope="col" className="p-4 text-label-lg text-ink-3">Product</th>
                  <th scope="col" className="p-4 text-label-lg text-ink-3">Facts</th>
                  <th scope="col" className="p-4 text-label-lg text-ink-3">Sources</th>
                </tr>
              </thead>
              <tbody>
                {page.products.map((product, index) => (
                  <tr key={product.name} className="align-top">
                    <td className="p-4 text-body-lg text-ink-3">{index + 1}</td>
                    <th scope="row" className="p-4 text-body-lg font-semibold text-ink">{product.name}</th>
                    <td className="p-4 text-body-lg text-ink-2">{product.details}</td>
                    <td className="p-4">
                      {sourceLabels(product.sources).map((label, i) => (
                        <a key={product.sources[i]} href={product.sources[i]} className="block text-body-sm text-clay underline-offset-4 hover:underline">
                          {label}
                        </a>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="picked-heading" className="w-full max-w-[860px]">
          <h2 id="picked-heading" className="text-h2 text-ink">How we picked</h2>
          <p className="mt-4 text-body-lg text-ink-2">A product must meet these criteria on its own website:</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-body-lg text-ink-2">
            {page.criteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ol>
          <p className="mt-4 text-body-lg text-ink-2">{page.rankRule}</p>
        </section>

        <section aria-labelledby="questions-heading" className="w-full max-w-[860px]">
          <h2 id="questions-heading" className="text-h2 text-ink">Questions</h2>
          <FaqList items={page.faqs} className="mt-6" />
        </section>
      </div>
    </>
  );
}
