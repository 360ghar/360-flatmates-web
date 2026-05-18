import { BASE_URL } from "@/lib/config";

interface BreadcrumbItem {
  name: string;
  item?: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.item ? { item: item.item } : {}),
    })),
  };
}

export function homeBreadcrumb(): BreadcrumbItem {
  return { name: "Home", item: BASE_URL };
}
