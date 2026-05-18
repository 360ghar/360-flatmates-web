import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "./landing-data";

export function FAQAccordion() {
  return (
    <section
      className="bg-paper py-20 md:py-24"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <div className="mb-14 text-center">
          <p className="text-eyebrow mb-5">FAQ</p>
          <h2 id="faq-heading" className="text-display max-w-xl mx-auto text-ink">
            Got questions? We got you
          </h2>
        </div>

        <div className="mx-auto max-w-3xl border-t border-line-low">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="faq-item group border-b border-line-low"
            >
              <summary className="flex cursor-pointer items-center justify-between py-6 text-h3 md:text-xl text-ink hover:text-accent transition-colors duration-300 list-none [&::-webkit-details-marker]:hidden">
                <span className="max-w-[85%] font-medium">{item.question}</span>
                <div className="h-8 w-8 rounded-full border border-line-low flex items-center justify-center transition-all duration-300 group-open:rotate-180 group-open:bg-accent group-open:border-accent group-open:text-white">
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                </div>
              </summary>
              <div className="faq-item-content">
                <div className="overflow-hidden border-l-2 border-accent/30 pl-4">
                  <p className="pb-6 text-body-lg text-ink-3 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-body-md text-ink-3 mb-5">Still confused?</p>
          <button className="text-label-lg text-ink-2 hover:text-accent transition-colors duration-300 border-b border-ink-4 hover:border-accent pb-1">
            Talk to us
          </button>
        </div>
      </div>
    </section>
  );
}
