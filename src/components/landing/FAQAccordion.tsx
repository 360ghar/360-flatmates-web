import { Link } from "react-router";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "./landing-data";

export function FAQAccordion() {
  return (
    <section
      className="py-20 md:py-24"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <h2 id="faq-heading" className="text-display mx-auto mb-10 max-w-3xl text-ink">
          Questions, answered.
        </h2>

        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="faq-item paper-grain group rounded-hand bg-surface px-5 shadow-xs open:shadow-sm"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-body-lg font-semibold text-ink transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <ChevronDown className="faq-chevron h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
              </summary>
              <div className="faq-item-content">
                <div className="overflow-hidden">
                  <p className="pb-5 text-body-lg leading-relaxed text-ink-2">
                    {item.answer}
                  </p>
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-body-md text-ink-2">
            Something else?{" "}
            <Link to="/about" className="font-semibold text-accent underline-offset-4 hover:underline">
              Talk to us
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

