import {
  LIFESTYLE_DIMENSIONS,
  LISTING_SHARING_TYPE_OPTIONS,
  MOVE_IN_TIMELINE_OPTIONS
} from "@/lib/data";

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit"
});

function getOptionLabel(
  value: string | undefined,
  options: readonly { value: string; label: string }[]
): string {
  if (!value) {
    return "";
  }

  const label = options.find((option) => option.value === value)?.label;
  if (label) return label;
  // Unknown or legacy value (e.g. "this_month"): readable, never raw snake_case.
  const words = value.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatCurrencyINR(amount: number): string {
  return INR_FORMATTER.format(amount);
}

export function formatRent(amount: number): string {
  return `${formatCurrencyINR(amount)}/mo`;
}

/** Rent in a map-tag width: ₹22k, ₹1.5L. */
export function formatRentShort(rent?: number): string {
  if (rent === undefined || !Number.isFinite(rent) || rent <= 0) return "₹--";
  const short = (value: number, unit: string) => `₹${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;
  if (rent >= 100000) return short(rent / 100000, "L");
  if (rent >= 1000) return short(rent / 1000, "k");
  return `₹${rent}`;
}

export function formatBudgetRange(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) {
    return `${formatCurrencyINR(min)} - ${formatCurrencyINR(max)}`;
  }

  if (min !== undefined) {
    return `From ${formatCurrencyINR(min)}`;
  }

  if (max !== undefined) {
    return `Up to ${formatCurrencyINR(max)}`;
  }

  return "Any budget";
}

const COUNT_FORMATTER = new Intl.NumberFormat("en-IN");

const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric"
});

/** Indian digit grouping (1,20,000) for counts and stats. */
export function formatCount(value: number): string {
  return COUNT_FORMATTER.format(value);
}

/** "June 2026"; empty for a missing or invalid date. */
export function formatMonthYear(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : MONTH_YEAR_FORMATTER.format(date);
}

export function formatDate(value: string | Date): string {
  return DATE_FORMATTER.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return DATE_TIME_FORMATTER.format(new Date(value));
}

export function formatMoveInTimeline(value?: string): string {
  return getOptionLabel(value, MOVE_IN_TIMELINE_OPTIONS);
}

export function formatSharingType(value?: string): string {
  return getOptionLabel(value, LISTING_SHARING_TYPE_OPTIONS);
}

export function formatLocation(locality?: string, city?: string): string {
  return [locality, city].filter(Boolean).join(", ");
}

export function formatFullPhone(localDigits: string): string {
  return `+91${localDigits}`;
}

export function humanizeSnakeCase(value: string): string {
  return value.replace(/_/g, " ");
}

export function formatLifestyleLabel(
  dimensionKey: string,
  value?: string | null
): string {
  if (!value) return "";
  const dim = LIFESTYLE_DIMENSIONS.find((d) => d.key === dimensionKey);
  if (!dim) return humanizeSnakeCase(value);
  const opt = dim.options.find((o) => o.value === value);
  return opt?.label ?? humanizeSnakeCase(value);
}

export function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

interface SelectOption {
  value: string;
  label: string;
}

export function toSelectOptions(
  source: readonly string[] | readonly { value: string; label: string }[]
): SelectOption[] {
  if (source.length === 0) return [];
  if (typeof source[0] === "string") {
    return (source as readonly string[]).map((v) => ({
      value: v,
      label: toTitleCase(humanizeSnakeCase(v)),
    }));
  }
  return (source as readonly { value: string; label: string }[]).map((o) => ({
    value: o.value,
    label: o.label,
  }));
}

export function stripEmptyFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== "" && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/** Coerce a numeric input to a number, mapping empty/NaN to undefined so a
 *  cleared field neither trips min/max validation nor gets sent to the API. */
/**
 * An input's value as an optional number. Accepts numbers too: react-hook-form
 * runs `setValueAs` on numeric default values (a saved age or budget).
 */
export function optionalNumberValue(raw: unknown): number | undefined {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : undefined;
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function formatRelativeTime(value?: string | Date): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Same day
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  // Within the last week
  if (diffDays < 7) {
    return date.toLocaleDateString("en-IN", { weekday: "long" });
  }

  // Otherwise
  return DATE_FORMATTER.format(date);
}

export function formatMessageTime(value?: string | Date): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const timeString = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  // Same day
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return timeString;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday, ${timeString}`;
  }

  // Older
  return `${DATE_FORMATTER.format(date)}, ${timeString}`;
}

