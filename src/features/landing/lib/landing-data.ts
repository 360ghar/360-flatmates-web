export interface FaqItem {
  question: string;
  answer: string;
}

/* Shown on the landing page and emitted as FAQPage JSON-LD, so the two stay
   the same text (Google requires FAQ markup to be visible). */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do you actually match people?",
    answer:
      "We compare six parts of daily life: sleep schedule, cleanliness, food habits, smoking and drinking, guests, and work style. Budget and location come on top. It is not only about who has a spare room, it is about who you can live with."
  },
  {
    question: "Are the listings real?",
    answer:
      "Every listing is reviewed before it goes live: rent and availability are checked, and owners or current flatmates confirm the details directly. Photos are optional at posting — owners can add them after publishing."
  },
  {
    question: "Is my data safe?",
    answer:
      "You sign in with a phone OTP, your number is never shared without your say, and we use industry-standard encryption. Your lifestyle answers appear on your profile and in swipe so matches can see how you live. We never sell your data."
  },
  {
    question: "Can I visit before I commit?",
    answer: "Yes. Book a visit from the chat: pick a time and it shows up in Visits for both of you."
  },
  {
    question: "What if a flatmate turns out to be a bad fit?",
    answer:
      "Matching cuts down on bad fits, but if things go wrong you can report or block anyone in the app and find a new match."
  },
  {
    question: "Is it free?",
    answer:
      "Searching and matching are free. Optional paid boosts put a listing or profile in front of more people; the core app costs nothing."
  },
  {
    question: "Which cities are you in?",
    answer: "We are live in Bangalore and Gurugram, with more cities to come."
  },
  {
    question: "How do I report someone?",
    answer: "Use Report on any listing, profile or chat. Our team reviews every report within 24 hours."
  }
];
