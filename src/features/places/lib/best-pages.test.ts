import { describe, expect, it } from "vitest";
import { HOME_URL, SITE_URL } from "@/lib/seo/config";
import { ORG_ID } from "@/lib/seo/schema";
import { BEST_PAGES, CHECKED_ON, PUBLISHER_LINE, bestPageJsonLd, sourceLabels, type BestPage } from "./best-pages";

type JsonLd = Record<string, unknown> & { "@type": string };

function schemaOf(page: BestPage, type: string): JsonLd {
  const found = bestPageJsonLd(page).find((node) => (node as JsonLd)["@type"] === type);
  if (!found) throw new Error(`no ${type} node for ${page.slug}`);
  return found as JsonLd;
}

describe("best-pages data", () => {
  it("uses the flatmates host and the shared 360Ghar organization id", () => {
    expect(SITE_URL).toBe("https://flatmates.360ghar.com");
    expect(ORG_ID).toBe("https://360ghar.com/#organization");
  });

  it("keeps the publisher line exact", () => {
    expect(PUBLISHER_LINE).toBe("Published by 360Ghar. We make 360 Flatmates, which is on this list.");
  });

  it("has three pages with unique slugs", () => {
    const slugs = BEST_PAGES.map((p) => p.slug);
    expect(slugs).toEqual([
      "best-flatmate-finder-apps-india",
      "best-roommate-finder-apps-india",
      "best-pg-finder-apps-gurgaon",
    ]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  for (const page of BEST_PAGES) {
    describe(page.slug, () => {
      it("uses the search term as the slug, and the title holds the same words", () => {
        expect(page.slug).toBe(page.title.toLowerCase().replace(/ /g, "-"));
      });

      it("gives a two-sentence direct answer", () => {
        expect(page.answer).toHaveLength(2);
        for (const sentence of page.answer) expect(sentence.endsWith(".")).toBe(true);
      });

      it("lists four criteria and a rank rule", () => {
        expect(page.criteria).toHaveLength(4);
        expect(page.rankRule.length).toBeGreaterThan(0);
      });

      it("ranks at least three products and includes 360 Flatmates", () => {
        expect(page.products.length).toBeGreaterThanOrEqual(3);
        expect(page.products.map((p) => p.name)).toContain("360 Flatmates");
      });

      it("gives every product a source URL and a checked-on date", () => {
        for (const product of page.products) {
          expect(product.sources.length).toBeGreaterThan(0);
          for (const source of product.sources) expect(source).toMatch(/^https:\/\//);
          expect(product.checkedOn).toBe(CHECKED_ON);
          expect(CHECKED_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      });

      it("has 5 or 6 FAQs, each a question", () => {
        expect(page.faqs.length).toBeGreaterThanOrEqual(5);
        expect(page.faqs.length).toBeLessThanOrEqual(6);
        for (const faq of page.faqs) expect(faq.question.endsWith("?")).toBe(true);
      });

      it("emits FAQPage JSON-LD with the same text as the visible FAQs", () => {
        const faqLd = schemaOf(page, "FAQPage") as JsonLd & { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
        expect(faqLd.mainEntity.map((q) => q.name)).toEqual(page.faqs.map((f) => f.question));
        expect(faqLd.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(page.faqs.map((f) => f.answer));
      });

      it("emits ItemList JSON-LD in table order, published by the organization", () => {
        const list = schemaOf(page, "ItemList") as JsonLd & {
          publisher: { "@id": string };
          itemListElement: { position: number; name: string }[];
        };
        expect(list.itemListElement.map((i) => i.name)).toEqual(page.products.map((p) => p.name));
        expect(list.itemListElement.map((i) => i.position)).toEqual(page.products.map((_, i) => i + 1));
        expect(list.publisher).toEqual({ "@id": ORG_ID });
      });

      it("emits BreadcrumbList that points only to Home and the page itself", () => {
        const crumbs = schemaOf(page, "BreadcrumbList") as JsonLd & {
          itemListElement: { name: string; item?: string }[];
        };
        expect(crumbs.itemListElement).toHaveLength(2);
        expect(crumbs.itemListElement[0]).toMatchObject({ name: "Home", item: HOME_URL });
        expect(crumbs.itemListElement[1]).toMatchObject({ name: page.title });
        expect(crumbs.itemListElement[1]).not.toHaveProperty("item");
      });

      it("uses no em dash or en dash in copy", () => {
        const text = JSON.stringify(page);
        expect(text).not.toContain("—");
        expect(text).not.toContain("–");
      });
    });
  }
});

describe("sourceLabels", () => {
  it("shows the host, without www, and numbers repeats of one host", () => {
    expect(
      sourceLabels([
        "https://www.nobroker.in/a",
        "https://www.nobroker.in/b",
        "https://flatmates.360ghar.com/",
      ]),
    ).toEqual(["nobroker.in", "nobroker.in (2)", "flatmates.360ghar.com"]);
  });
});
