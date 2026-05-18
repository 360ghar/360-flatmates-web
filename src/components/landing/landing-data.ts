import type { LucideIcon } from "lucide-react";
import {
  BedDouble,
  CalendarCheck,
  CheckCircle,
  Heart,
  Home,
  MapPin,
  MessageSquareText,
  Moon,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Target,
  Utensils,
  Users,
  Wine,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Type definitions
   ───────────────────────────────────────────── */

export interface BentoFeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
  tint: string;
  span: "hero" | "wide" | "square";
  tags?: string[];
}

export interface DimensionItem {
  label: string;
  icon: LucideIcon;
  tint: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface StatItem {
  display: string;
  label: string;
  numericValue: number;
}

export interface TestimonialItem {
  quote: string;
  name: string;
  city: string;
  compatibility: number;
}

export interface CityItem {
  name: string;
  listings: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/* ─────────────────────────────────────────────
   Data constants — Gen Z copy, punchy & direct
   ───────────────────────────────────────────── */

export const BENTO_FEATURES: BentoFeatureItem[] = [
  {
    title: "Matching that actually matters",
    description:
      "We go way beyond budget and pin code. 6 lifestyle dimensions — sleep, clean, food, guests, work, vibe — so your flatmate actually fits your life.",
    icon: Sparkles,
    tint: "bg-accent-soft text-accent",
    span: "hero",
  },
  {
    title: "No fake listings, period",
    description: "Every room gets reviewed before it goes live. Real photos, real rent, real availability.",
    icon: ShieldCheck,
    tint: "bg-green-soft text-green-mid",
    span: "square",
  },
  {
    title: "Safety built in",
    description: "Phone OTP, profile checks, in-app reporting. We take your safety seriously so you don't have to worry.",
    icon: CheckCircle,
    tint: "bg-accent-soft text-accent",
    span: "square",
  },
  {
    title: "Book visits in 2 taps",
    description: "No more WhatsApp ping-pong. Pick a slot, show up, done.",
    icon: CalendarCheck,
    tint: "bg-teal-soft text-teal-mid",
    span: "square",
  },
  {
    title: "Chat that starts with context",
    description:
      "No more \"hey\" from a stranger. Every conversation already has the listing, the match score, and visit details built in.",
    icon: MessageSquareText,
    tint: "bg-blue-soft text-blue-mid",
    span: "wide",
  },
  {
    title: "Vibe check before you move",
    description: "Veg-only, pet-friendly, quiet weekdays, social weekends — know the deal before you sign anything.",
    icon: Users,
    tint: "bg-purple-soft text-purple-mid",
    span: "wide",
    tags: ["Veg-only", "Pet friendly", "Quiet weekdays", "Social weekends"],
  },
];

export const DIMENSIONS: DimensionItem[] = [
  { label: "Sleep", icon: Moon, tint: "bg-purple-soft text-purple-mid" },
  { label: "Clean", icon: SprayCan, tint: "bg-blue-soft text-blue-mid" },
  { label: "Food", icon: Utensils, tint: "bg-green-soft text-green-mid" },
  { label: "Guests", icon: Users, tint: "bg-orange-soft text-orange-mid" },
  { label: "Work", icon: BedDouble, tint: "bg-teal-soft text-teal-mid" },
  { label: "Lifestyle", icon: Wine, tint: "bg-pink-soft text-pink-mid" },
];

export const STEPS: StepItem[] = [
  {
    number: "01",
    title: "Tell us your vibe",
    description: "Budget, location, and the stuff that actually matters — like whether you're a night owl or a 6 AM gym person.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Get matched",
    description: "Our engine finds flatmates and rooms that fit how you actually live. Not just where. How.",
    icon: Target,
  },
  {
    number: "03",
    title: "Move in",
    description: "Book a visit, chat with context, sign up. That's it. Welcome home.",
    icon: Home,
  },
];

export const STATS: StatItem[] = [
  { display: "10K+", label: "Matches made", numericValue: 10000 },
  { display: "5K+", label: "Rooms listed", numericValue: 5000 },
  { display: "86%", label: "Avg. match score", numericValue: 86 },
  { display: "2", label: "Cities live", numericValue: 2 },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      "I was dreading the flatmate hunt but the compatibility score literally saved me from moving in with someone who'd blast music at midnight. Found my person on the first try.",
    name: "Priya M.",
    city: "Bangalore",
    compatibility: 86,
  },
  {
    quote:
      "The vibe tags are everything. I'm veg and found a flat where that's respected — no awkward convos, no passive-aggressive fridge wars. Already told 3 friends about it.",
    name: "Rohan K.",
    city: "Delhi NCR",
    compatibility: 92,
  },
];

export const CITIES: CityItem[] = [
  { name: "Gurugram", listings: 860 },
  { name: "Bangalore", listings: 1200 },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do you actually match people?",
    answer:
      "We compare 6 lifestyle dimensions — sleep schedule, cleanliness, food habits, guests policy, work style, and general vibe — alongside budget and location. It's not just about who has a spare room, it's about who you can actually live with.",
  },
  {
    question: "Are the listings legit?",
    answer:
      "Yeah, every listing gets reviewed before it goes live. Real photos, real rent, real availability. Landlords and current flatmates confirm the details directly. No bait-and-switch.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yep. Phone OTP login, no contact sharing without your say-so, and industry-standard encryption. Your lifestyle preferences are for matching only — we never sell or share them.",
  },
  {
    question: "Can I visit before I commit?",
    answer:
      "Obviously. Book a visit right from the app — pick a time, show up. No WhatsApp back-and-forth needed.",
  },
  {
    question: "What if my flatmate turns out to be awful?",
    answer:
      "Our matching cuts down on bad fits big time, but if things go sideways, you've got in-app reporting and conflict tools. And you can always find a new match on the platform.",
  },
  {
    question: "Is it free?",
    answer:
      "Searching and matching is 100% free. There are optional paid plans for stuff like priority listings and boosted profile visibility, but the core experience costs nothing.",
  },
  {
    question: "Which cities are you in?",
    answer:
      "We're live in Gurugram and Bangalore right now, with more cities dropping every month.",
  },
  {
    question: "How do I report someone?",
    answer:
      "Hit the report button on any listing or profile. Our team reviews it within 24 hours. For urgent stuff, there's an emergency button in every chat.",
  },
];

/* ─────────────────────────────────────────────
   Hero mini-card data
   ───────────────────────────────────────────── */

export const HERO_MINI_CARDS = [
  {
    type: "listing" as const,
    price: "₹18,000/mo",
    title: "Sunlit room in Koramangala",
    location: "Koramangala 4th Block",
    match: 86,
  },
  {
    type: "compatibility" as const,
    score: 92,
    label: "Match Score",
  },
  {
    type: "chat" as const,
    message: "Hey! Saw we're a 92% match 😄",
    time: "2m ago",
  },
  {
    type: "verified" as const,
    label: "Verified Profile",
  },
];

/* ─────────────────────────────────────────────
   Bento hero card dimension pills (used in FeatureBento)
   ───────────────────────────────────────────── */

export { Heart, MapPin };
