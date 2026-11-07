import { SITE_URL } from "../../../lib/seo/config";
import { buildBreadcrumbJsonLd, buildFaqPageSchema, ORG_ID } from "../../../lib/seo/schema";

/*
 * Data for the "best X" pages. The static HTML generator (scripts/lib/route-content.ts)
 * and the React route (src/features/places/pages/BestPage.tsx) both read this file.
 * Every product fact has a source URL on the product's own website and a checked-on date.
 */

export const CHECKED_ON = "2026-11-08";

export const PUBLISHER_LINE = "Published by 360Ghar. We make 360 Flatmates, which is on this list.";

export interface BestProduct {
  name: string;
  /** Plain facts only. Each fact must appear on a page listed in `sources`. */
  details: string;
  /** Product pages that support `details`, in the order the products are checked. */
  sources: string[];
  checkedOn: string;
}

export interface BestFaq {
  question: string;
  answer: string;
}

export interface BestPage {
  slug: string;
  /** Exact search term, in sentence case. Used in <title> and <h1>. */
  title: string;
  description: string;
  /** The direct answer, as two sentences. */
  answer: [string, string];
  /** The criteria a product must meet, each checked on its own website. */
  criteria: string[];
  /** How the criteria set the order of `products`. */
  rankRule: string;
  /** Rows in rank order. */
  products: BestProduct[];
  faqs: BestFaq[];
}

const FLATMATES_HOME = `${SITE_URL}/`;

const FLATMATE_PRODUCTS: BestProduct[] = [
  {
    name: "360 Flatmates",
    details:
      "A flatmate matching app and website. It ranks people on a compatibility score across six lifestyle areas. Searching and matching are free. It lists rooms and flatmates in Bangalore and Gurugram.",
    sources: [FLATMATES_HOME, `${SITE_URL}/cities/bangalore`, `${SITE_URL}/cities/gurugram`],
    checkedOn: CHECKED_ON,
  },
  {
    name: "FlatMate.in",
    details:
      "A broker-free platform to find flats and flatmates. It lists flatmates in Bangalore and Gurgaon, among other cities.",
    sources: ["https://www.flatmate.in/flatmates-in-bangalore", "https://www.flatmate.in/flatmates-in-gurgaon"],
    checkedOn: CHECKED_ON,
  },
  {
    name: "NoBroker",
    details:
      "A property site with flatmate and roommate search pages. It has pages for flatmates and roommates in Bangalore and Gurgaon.",
    sources: [
      "https://www.nobroker.in/sitemap/flatmate/bangalore/rooms",
      "https://www.nobroker.in/sitemap/flatmate/gurgaon/rooms",
    ],
    checkedOn: CHECKED_ON,
  },
  {
    name: "Roomies",
    details:
      "A flatmate finder for listing and finding flatmates and rooms. Its top cities are Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad and Jaipur. It says that listing, searching and messaging are free.",
    sources: ["https://www.roomies.co.in/"],
    checkedOn: CHECKED_ON,
  },
];

const FLATMATE_CRITERIA = [
  "The product lets a renter search for rooms or flatmates on its own website.",
  "The product says that searching or messaging is free for the renter, on its own website.",
  "The product has a flatmate or roommate search or matching feature on its own website.",
  "The product lists Bangalore and Gurugram (Gurgaon) on its own website.",
];

const FLATMATE_FAQS: BestFaq[] = [
  {
    question: "What is the best flatmate finder app in India?",
    answer:
      "This page does not name one best app. It ranks four products by the criteria on this page. 360 Flatmates meets all four criteria.",
  },
  {
    question: "Is 360 Flatmates free to use?",
    answer:
      "Searching and matching are free on 360 Flatmates, as stated on its home page on 2026-11-08. Check the current terms before you pay for any feature.",
  },
  {
    question: "Which cities does 360 Flatmates cover?",
    answer: "360 Flatmates lists rooms and flatmates in Bangalore and Gurugram.",
  },
  {
    question: "Do these apps charge brokerage?",
    answer:
      "Some products on this list say they are broker-free or free for renters. Read the current fee terms on each product's own website before you pay anything.",
  },
  {
    question: "How do I check a flatmate before I move in?",
    answer:
      "Meet the person before you agree to share a home. Visit the room in person and read the rental agreement before you pay a deposit.",
  },
  {
    question: "Why is the list in this order?",
    answer:
      "Each product is ranked by how many of the four criteria it meets on its own website. Products with the same count are listed in alphabetical order.",
  },
];

const ROOMMATE_CRITERIA = [
  "The product lets a renter search for rooms or roommates on its own website.",
  "The product says that searching or messaging is free for the renter, on its own website.",
  "The product has a roommate or flatmate search or matching feature on its own website.",
  "The product lists Bangalore and Gurugram (Gurgaon) on its own website.",
];

const ROOMMATE_FAQS: BestFaq[] = [
  {
    question: "What is the best roommate finder app in India?",
    answer:
      "This page does not name one best app. It ranks four products by the criteria on this page. 360 Flatmates meets all four criteria.",
  },
  {
    question: "Is 360 Flatmates free for roommates?",
    answer:
      "Searching and matching are free on 360 Flatmates, as stated on its home page on 2026-11-08. Check the current terms before you pay for any feature.",
  },
  {
    question: "Can I find a roommate in Bangalore and Gurugram?",
    answer:
      "360 Flatmates lists rooms and flatmates in both cities. The other products on this list cover Bangalore, and some cover Gurgaon (Gurugram).",
  },
  {
    question: "Do these apps charge brokerage?",
    answer:
      "Some products on this list say they are broker-free or free for renters. Read the current fee terms on each product's own website before you pay anything.",
  },
  {
    question: "How do I check a roommate before I move in?",
    answer:
      "Meet the person before you agree to share a home. Visit the room in person and read the rental agreement before you pay a deposit.",
  },
  {
    question: "Why is the list in this order?",
    answer:
      "Each product is ranked by how many of the four criteria it meets on its own website. Products with the same count are listed in alphabetical order.",
  },
];

const PG_PRODUCTS: BestProduct[] = [
  {
    name: "Stanza Living",
    details:
      "A managed PG and co-living operator. It lists women-only and unisex PGs in Gurgaon. A listed Sohna Road double room costs Rs. 11,499 a month. The minimum stay is generally 3 months. A visit can be scheduled.",
    sources: ["https://www.stanzaliving.com/gurgaon"],
    checkedOn: CHECKED_ON,
  },
  {
    name: "Zolo",
    details:
      "A co-living and PG operator. It lists unisex PGs in Gurgaon, with rents from Rs. 4,307 a month. Food is not included. Stay packages run for 3, 6 and 11 months. A property visit comes before a prebooking payment.",
    sources: ["https://zolostays.com/women-pgs-in-gurugram"],
    checkedOn: CHECKED_ON,
  },
  {
    name: "360 Flatmates",
    details:
      "A flatmate matching app and website. It lists rooms and flats in Gurugram (Gurgaon). Visits can be booked.",
    sources: [`${SITE_URL}/cities/gurugram`, FLATMATES_HOME],
    checkedOn: CHECKED_ON,
  },
  {
    name: "FlatMate.in",
    details:
      "A platform to find flats, PGs and flatmates. It lists PG accommodation in Gurgaon, and each listing shows a rent.",
    sources: ["https://www.flatmate.in/pg-in-gurgaon"],
    checkedOn: CHECKED_ON,
  },
];

const PG_CRITERIA = [
  "The product lists PG or room accommodation in Gurgaon (Gurugram) on its own website.",
  "The product states a monthly rent on its own website.",
  "The product lets a renter schedule a visit or book on its own website.",
  "The product states a minimum stay or stay packages on its own website.",
];

const PG_FAQS: BestFaq[] = [
  {
    question: "Which PG finder apps list Gurgaon accommodation?",
    answer:
      "Stanza Living, Zolo, 360 Flatmates and FlatMate.in list accommodation in Gurgaon, according to their own websites. The table gives the source for each product.",
  },
  {
    question: "Do Stanza Living and Zolo list other people's rooms?",
    answer:
      "No. Stanza Living and Zolo describe their properties as managed or co-living places. They take bookings on their own websites.",
  },
  {
    question: "How much rent do the listed PGs cost?",
    answer:
      "Zolo's Gurgaon page lists rents from Rs. 4,307 a month. Stanza Living's Gurgaon page lists a Sohna Road double room from Rs. 11,499 a month. Rents change, so check each site.",
  },
  {
    question: "Do the rents include food?",
    answer:
      "Zolo's Gurgaon page says food is not included. Stanza Living's Gurgaon page says its managed PGs include meals. Check the meal terms for each property before you book.",
  },
  {
    question: "What is the minimum stay?",
    answer:
      "Stanza Living's Gurgaon page says the minimum stay is generally 3 months. Zolo's page lists stay packages of 3, 6 and 11 months.",
  },
  {
    question: "Are women-only PGs available?",
    answer:
      "Stanza Living's Gurgaon page lists women-only and unisex PGs. Zolo's Gurgaon page lists unisex residences only.",
  },
];

export const BEST_PAGES: BestPage[] = [
  {
    slug: "best-flatmate-finder-apps-india",
    title: "Best flatmate finder apps India",
    description:
      "Compare flatmate finder apps in India: 360 Flatmates, FlatMate.in, NoBroker and Roomies. Each product is checked on its own website.",
    answer: [
      "For flatmate search in India, this list ranks four products: 360 Flatmates, FlatMate.in, NoBroker and Roomies.",
      "Each product is ranked by the criteria below, and each fact links to the product's own website.",
    ],
    criteria: FLATMATE_CRITERIA,
    rankRule:
      "Products are ranked by how many of the four criteria they meet. Products with the same count are listed in alphabetical order.",
    products: FLATMATE_PRODUCTS,
    faqs: FLATMATE_FAQS,
  },
  {
    slug: "best-roommate-finder-apps-india",
    title: "Best roommate finder apps India",
    description:
      "Compare roommate finder apps in India: 360 Flatmates, FlatMate.in, NoBroker and Roomies. The criteria and sources match our flatmate list.",
    answer: [
      "For roommate search in India, this list ranks four products: 360 Flatmates, FlatMate.in, NoBroker and Roomies.",
      "The ranking uses the same criteria as the flatmate list, and each product is checked on its own website.",
    ],
    criteria: ROOMMATE_CRITERIA,
    rankRule:
      "Products are ranked by how many of the four criteria they meet. Products with the same count are listed in alphabetical order.",
    products: FLATMATE_PRODUCTS,
    faqs: ROOMMATE_FAQS,
  },
  {
    slug: "best-pg-finder-apps-gurgaon",
    title: "Best PG finder apps Gurgaon",
    description:
      "Compare PG finder apps in Gurgaon: Stanza Living, Zolo, 360 Flatmates and FlatMate.in. Rents and stay terms are checked on each product's own website.",
    answer: [
      "Stanza Living and Zolo run their own PG properties in Gurgaon, and each states its rents on its own website.",
      "360 Flatmates and FlatMate.in also list accommodation in Gurgaon, and the table gives the source for each product.",
    ],
    criteria: PG_CRITERIA,
    rankRule:
      "Products are ranked by how many of the four criteria they meet. Products with the same count are listed in alphabetical order.",
    products: PG_PRODUCTS,
    faqs: PG_FAQS,
  },
];

/** JSON-LD for one page. The FAQ entries are the same objects that the page renders. */
/** Short link text for a source URL: the host, numbered when one product cites the same host more than once. */
export function sourceLabels(sources: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return sources.map((source) => {
    const host = new URL(source).hostname.replace(/^www\./, "");
    const count = (seen.get(host) ?? 0) + 1;
    seen.set(host, count);
    return count === 1 ? host : `${host} (${count})`;
  });
}

export function bestPageJsonLd(page: BestPage): object[] {
  return [
    buildFaqPageSchema(page.faqs),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: page.title,
      description: page.description,
      numberOfItems: page.products.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      publisher: { "@id": ORG_ID },
      itemListElement: page.products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: product.sources[0],
      })),
    },
    buildBreadcrumbJsonLd([{ name: "Home", item: SITE_URL }, { name: page.title }]),
  ];
}
