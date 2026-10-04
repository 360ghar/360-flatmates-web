import type { FaqEntry } from "@/components/ui/FaqList";
import type { Neighborhood } from "@/lib/seo/neighborhoods";

/* Shown on the page and emitted as FAQPage JSON-LD from the same list, so
   the markup always matches visible text (a Google requirement). */

export function cityFaq(cityName: string, areas: ReadonlyArray<Neighborhood>): FaqEntry[] {
  return [
    {
      question: `How do I find a flatmate in ${cityName}?`,
      answer: `Make a free profile, set your budget and the ${cityName} areas you like, and we match you with people whose daily life fits yours. You can book a visit to the room from the chat.`
    },
    {
      question: `Are the listings in ${cityName} verified?`,
      answer: "Yes. Every listing is reviewed before it goes live: rent and availability are checked. Photos are optional at posting."
    },
    {
      question: `Is 360 Flatmates free to use in ${cityName}?`,
      answer: "Searching, matching and booking visits are free. Optional paid boosts show a listing to more people."
    },
    {
      question: `Which ${cityName} areas can I search?`,
      answer: `${areas.slice(0, 5).map((area) => area.name).join(", ")} and more. Each area has its own page with the rooms listed there.`
    }
  ];
}

export function neighbourhoodFaq(cityName: string, area: Neighborhood, nearby: ReadonlyArray<Neighborhood>): FaqEntry[] {
  return [
    {
      question: `How do I find a flatmate in ${area.name}?`,
      answer: `Make a free profile, choose ${area.name} in ${cityName} as your area, and we match you with people whose daily life fits yours. You can book a visit from the chat.`
    },
    {
      question: `What is ${area.name} like for shared living?`,
      answer: area.blurb
    },
    {
      question: `Are rooms in ${area.name} verified?`,
      answer: "Yes. Every listing is reviewed before it goes live: rent and availability are checked. Photos are optional at posting."
    },
    {
      question: `Which areas are near ${area.name}?`,
      answer: `${nearby.slice(0, 3).map((n) => n.name).join(", ")} are also on 360 Flatmates, each with its own page.`
    }
  ];
}
