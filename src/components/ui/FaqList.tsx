import { ChevronDown } from "lucide-react";
import { cn } from "./component-utils";

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Questions as native <details> sheets: keyboard and screen-reader support
 * for free. Pages that emit FAQPage JSON-LD must render the same entries here.
 */
export function FaqList({ items, className }: { items: ReadonlyArray<FaqEntry>; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <details
          key={item.question}
          className="faq-item paper-grain group rounded-hand bg-surface px-5 shadow-xs open:bg-surface-elevated open:shadow-sm"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-body-lg font-semibold text-ink transition-colors hover:text-clay focus-visible:rounded-cut-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <ChevronDown className="faq-chevron h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
          </summary>
          <div className="faq-item-content">
            <div className="overflow-hidden">
              <p className="pb-5 text-body-lg text-ink-2">{item.answer}</p>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
