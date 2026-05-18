import type { LucideIcon } from "lucide-react";
import {
  BedDouble,
  CalendarCheck,
  CheckCircle,
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

export interface FeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
  tint: string;
  layout?: "hero" | "icon-row" | "compact-card" | "tags-card";
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
  tint: string;
  accent: string;
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
  tint: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface AppPreviewStepItem {
  title: string;
  description: string;
  tint: string;
  icon: string;
}

/* ─────────────────────────────────────────────
   Data constants
   ───────────────────────────────────────────── */

export const FEATURES: FeatureItem[] = [
  {
    title: "6-Dimension Matching",
    description:
      "Sleep schedule, cleanliness, food habits, guests policy, work style, and lifestyle preferences. Every dimension matters.",
    icon: Sparkles,
    tint: "bg-orange-soft text-orange-mid",
    layout: "hero",
  },
  {
    title: "Verified Listings",
    description:
      "Every listing is reviewed before going live. Real photos, real rents, real availability.",
    icon: ShieldCheck,
    tint: "bg-green-soft text-green-mid",
    layout: "compact-card",
  },
  {
    title: "Safety First",
    description:
      "Phone OTP verification, profile moderation, and in-app reporting. Your safety is non-negotiable.",
    icon: CheckCircle,
    tint: "bg-accent-soft text-accent",
    layout: "compact-card",
  },
  {
    title: "Schedule Visits",
    description:
      "Book property tours and flatmate meets directly from the app. No back-and-forth WhatsApp threads.",
    icon: CalendarCheck,
    tint: "bg-teal-soft text-teal-mid",
    layout: "compact-card",
  },
  {
    title: "Context-Aware Chat",
    description:
      "Conversations start with shared context: the listing, the compatibility score, the visit details.",
    icon: MessageSquareText,
    tint: "bg-blue-soft text-blue-mid",
    layout: "compact-card",
  },
  {
    title: "Society Vibe Tags",
    description:
      "Vegetarian friendly, pet friendly, quiet weekday rhythm, social weekends. Know the vibe before you move.",
    icon: Users,
    tint: "bg-purple-soft text-purple-mid",
    layout: "tags-card",
    tags: ["Vegetarian friendly", "Pet friendly", "Quiet weekdays", "Social weekends"],
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
    title: "Set your preferences",
    description: "Tell us your budget, location, and the lifestyle habits that matter to you.",
    tint: "bg-accent-soft",
    accent: "text-accent",
  },
  {
    number: "02",
    title: "Get matched",
    description: "Our 6-dimension engine finds flatmates and rooms that fit how you actually live.",
    tint: "bg-teal-soft",
    accent: "text-teal-mid",
  },
  {
    number: "03",
    title: "Move in",
    description: "Schedule a visit, chat with context, and move in with confidence.",
    tint: "bg-green-soft",
    accent: "text-green-mid",
  },
];

/** Used by StatsMarquee — single source of truth. */
export const STATS: StatItem[] = [
  { display: "10K+", label: "Matched", numericValue: 10000 },
  { display: "5K+", label: "Listings", numericValue: 5000 },
  { display: "86%", label: "Avg. Compatibility", numericValue: 86 },
  { display: "2", label: "Cities", numericValue: 2 },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      "I was dreading the flatmate search, but the compatibility score saved me from a bad match. Found someone who matches my sleep schedule and food habits on the first try.",
    name: "Priya M.",
    city: "Bangalore",
    compatibility: 86,
  },
  {
    quote:
      "The society vibe tags were a game-changer. I'm vegetarian and found a flat where everyone respects that. No awkward conversations needed.",
    name: "Rohan K.",
    city: "Delhi NCR",
    compatibility: 92,
  },
  // {
  //   quote:
  //     "Moving to a new city was stressful enough. 360 Flatmates made finding a flatmate who gets my work-from-home routine effortless.",
  //   name: "Ananya S.",
  //   city: "Pune",
  //   compatibility: 79,
  // },
  // {
  //   quote:
  //     "Verified listings meant no more scam photos or fake rents. What I saw is what I got. Already recommended it to three friends.",
  //   name: "Vikram T.",
  //   city: "Hyderabad",
  //   compatibility: 88,
  // },
];

export const CITIES: CityItem[] = [
  { name: "Gurugram", listings: 860, tint: "bg-coral-soft text-coral-mid" },
  { name: "Bangalore", listings: 1200, tint: "bg-teal-soft text-teal-mid" },
  // { name: "Mumbai", listings: 1100, tint: "bg-orange-soft text-orange-mid" },
  // { name: "Delhi NCR", listings: 950, tint: "bg-purple-soft text-purple-mid" },
  // { name: "Pune", listings: 780, tint: "bg-green-soft text-green-mid" },
  // { name: "Hyderabad", listings: 620, tint: "bg-blue-soft text-blue-mid" },
  // { name: "Chennai", listings: 540, tint: "bg-pink-soft text-pink-mid" },
  // { name: "Kolkata", listings: 380, tint: "bg-yellow-soft text-yellow-mid" },
  // { name: "Ahmedabad", listings: 290, tint: "bg-teal-soft text-teal-mid" },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does 360 Flatmates match people?",
    answer:
      "Our matching engine compares six lifestyle dimensions — sleep schedule, cleanliness, food habits, guests policy, work style, and lifestyle preferences — alongside budget, location, and listing details to find your most compatible flatmate.",
  },
  {
    question: "How are listings verified?",
    answer:
      "Every listing goes through a review process before going live. We verify real photos, accurate rents, and actual availability. Landlords and existing flatmates confirm details directly.",
  },
  {
    question: "Is my personal data safe?",
    answer:
      "Yes. We use phone OTP verification, never share your contact details without consent, and follow industry-standard encryption. Your lifestyle preferences are used only for matching — never sold or shared.",
  },
  {
    question: "Can I visit before committing?",
    answer:
      "Absolutely. You can schedule property tours and flatmate meets directly from the app. No back-and-forth WhatsApp threads — just pick a time and show up.",
  },
  {
    question: "What if my flatmate and I don't get along?",
    answer:
      "While our 6-dimension matching significantly reduces incompatibility, we also provide in-app conflict resolution tools and reporting features. You can always find a new match through the platform.",
  },
  {
    question: "Is 360 Flatmates free to use?",
    answer:
      "Yes, searching and matching is completely free. Premium features like priority listings and enhanced profile visibility are available through affordable plans.",
  },
  {
    question: "Which cities are supported?",
    answer:
      "We're currently active in Gurugram and Bangalore — with more cities added every month.",
  },
  {
    question: "How do I report a problem?",
    answer:
      "Use the in-app reporting feature on any listing or profile. Our moderation team reviews reports within 24 hours. For urgent safety concerns, use the emergency button available on every chat screen.",
  },
];

export const APP_PREVIEW_STEPS: AppPreviewStepItem[] = [
  {
    title: "Preference Setup",
    description: "Customize your 6-dimension lifestyle profile",
    tint: "bg-accent-soft text-accent",
    icon: "Sparkles",
  },
  {
    title: "Smart Matches",
    description: "Browse compatibility-scored flatmates and rooms",
    tint: "bg-teal-soft text-teal-mid",
    icon: "Target",
  },
  {
    title: "Coordinate",
    description: "Start conversations with shared listing details",
    tint: "bg-green-soft text-green-mid",
    icon: "MessageSquareText",
  },
];

/* ─────────────────────────────────────────────
   Icon map for string-based icon lookups
   ───────────────────────────────────────────── */

export const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  MessageSquareText,
  Users,
  Moon,
  SprayCan,
  Utensils,
  BedDouble,
  Wine,
  CheckCircle,
  MapPin,
  Target,
};
