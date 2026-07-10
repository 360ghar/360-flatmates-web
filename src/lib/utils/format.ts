import {
  FLATMATE_MODE_OPTIONS,
  LIFESTYLE_DIMENSIONS,
  LISTING_SHARING_TYPE_OPTIONS,
  MOVE_IN_TIMELINE_OPTIONS
} from "@/lib/data";

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const COMPACT_INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1
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

  return options.find((option) => option.value === value)?.label ?? value;
}

export function formatCurrencyINR(amount: number): string {
  return INR_FORMATTER.format(amount);
}

export function formatCompactINR(amount: number): string {
  return INR_FORMATTER.formatToParts(amount)[0]?.value === "-"
    ? `-${COMPACT_INR_FORMATTER.format(Math.abs(amount))}`
    : COMPACT_INR_FORMATTER.format(amount);
}

export function formatRent(amount: number): string {
  return `${formatCurrencyINR(amount)}/mo`;
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

export function formatDate(value: string | Date): string {
  return DATE_FORMATTER.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return DATE_TIME_FORMATTER.format(new Date(value));
}

export function formatDistanceKm(distanceKm?: number): string {
  if (distanceKm === undefined) {
    return "";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatMoveInTimeline(value?: string): string {
  return getOptionLabel(value, MOVE_IN_TIMELINE_OPTIONS);
}

export function formatMode(value?: string): string {
  return getOptionLabel(value, FLATMATE_MODE_OPTIONS);
}

export function formatSharingType(value?: string): string {
  return getOptionLabel(value, LISTING_SHARING_TYPE_OPTIONS);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export function formatLocation(locality?: string, city?: string): string {
  return [locality, city].filter(Boolean).join(", ");
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

