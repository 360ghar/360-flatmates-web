import type { LucideIcon } from "lucide-react";

export const APP_STORE_URL = "https://apps.apple.com/in/app/360-flatmates/id6771899300";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.the360ghar.flatmates360";
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
  span: "wide" | "square";
  /** Visual treatment of the cell background. */
  variant?: "plain" | "gradient" | "image";
  /** Tailwind gradient utilities, used when variant === "gradient". */
  gradient?: string;
  /** Unsplash photo id, used when variant === "image". */
  image?: string;
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
   Data constants. Gen Z copy, punchy and direct.
   ───────────────────────────────────────────── */

/**
 * Five bento features. The 6-dimension compatibility story lives in its own
 * CompatibilitySection now, so it is intentionally not in this grid.
 * Order matters: it fills a 4-col grid as 2+1+1 / 2+2 with no empty cells.
 */
export const BENTO_FEATURES: BentoFeatureItem[] = [
  {
    title: "Vibe check before you move",
    description:
      "Veg-only, pet-friendly, quiet weekdays, social weekends. Know exactly what you're walking into before you sign anything.",
    icon: Users,
    tint: "bg-purple-soft text-purple-mid",
    span: "wide",
    variant: "plain",
    tags: ["Veg-only", "Pet friendly", "Quiet weekdays", "Social weekends"],
  },
  {
    title: "No fake listings, period",
    description: "Every room is reviewed before it goes live. Real photos, real rent, real availability.",
    icon: ShieldCheck,
    tint: "bg-surface/90 text-green-mid",
    span: "square",
    variant: "image",
    image: "1522771739844-6a9f6d5f14af",
  },
  {
    title: "Safety built in",
    description: "Phone OTP, profile checks, and in-app reporting, so you can focus on finding the right fit.",
    icon: CheckCircle,
    tint: "bg-surface text-green-mid",
    span: "square",
    variant: "gradient",
    gradient: "bg-gradient-to-br from-green-soft via-green-soft to-surface",
  },
  {
    title: "Book visits in 2 taps",
    description: "No more WhatsApp ping-pong. Pick a slot, show up, done.",
    icon: CalendarCheck,
    tint: "bg-surface text-teal-mid",
    span: "wide",
    variant: "gradient",
    gradient: "bg-gradient-to-br from-teal-soft via-teal-soft to-surface",
  },
  {
    title: "Chat that starts with context",
    description:
      "No cold \"hey\" from a stranger. Every chat already carries the listing, the match score, and visit details.",
    icon: MessageSquareText,
    tint: "bg-blue-soft text-blue-mid",
    span: "wide",
    variant: "plain",
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
    description: "Budget, location, and the stuff that actually matters, like whether you're a night owl or a 6 AM gym person.",
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
  { display: "5K+", label: "Verified rooms", numericValue: 5000 },
  { display: "86%", label: "Avg. match score", numericValue: 86 },
  { display: "2", label: "Cities live", numericValue: 2 },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      "The compatibility score saved me from moving in with someone who'd blast music at midnight. Found my person on the first try.",
    name: "Priya M.",
    city: "Bangalore",
    compatibility: 86,
  },
  {
    quote:
      "I'm veg and found a flat where that's actually respected. No awkward convos, no fridge wars. Already told three friends.",
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
      "We compare 6 lifestyle dimensions (sleep schedule, cleanliness, food habits, guests policy, work style, and general vibe) alongside budget and location. It's not just about who has a spare room, it's about who you can actually live with.",
  },
  {
    question: "Are the listings legit?",
    answer:
      "Yeah, every listing gets reviewed before it goes live. Real photos, real rent, real availability. Landlords and current flatmates confirm the details directly. No bait-and-switch.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yep. Phone OTP login, no contact sharing without your say-so, and industry-standard encryption. Your lifestyle preferences are for matching only, and we never sell or share them.",
  },
  {
    question: "Can I visit before I commit?",
    answer:
      "Obviously. Book a visit right from the app: pick a time, show up. No WhatsApp back-and-forth needed.",
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
   Re-exports used by hero mini-cards
   ───────────────────────────────────────────── */

export { Heart, MapPin };
