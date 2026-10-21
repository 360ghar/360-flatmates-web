import { Link } from "react-router";
import { FaqList } from "@/components/ui/FaqList";
import { FAQ_ITEMS } from "@/features/landing/lib/landing-data";

/** The questions people ask before they trust a flatmate app, on a paper band. */
export function FAQAccordion() {
  return (
    <section aria-labelledby="faq-heading" className="paper-edge-torn-y paper-grain bg-paper-1 py-[calc(var(--torn-depth)+64px)] md:py-[calc(var(--torn-depth)+88px)]">
      <div className="page-container">
        <h2 id="faq-heading" className="text-display mx-auto max-w-[720px] scroll-mt-24 text-ink">
          Questions, answered.
        </h2>

        <FaqList items={FAQ_ITEMS} className="mx-auto mt-10 max-w-[720px]" />

        <p className="mx-auto mt-8 max-w-[720px] text-body-md text-ink-2">
          Something else?{" "}
          <a href="mailto:hello@360ghar.com" className="font-semibold text-clay underline-offset-4 hover:underline">
            Write to us
          </a>
          {" "}or read the{" "}
          <Link to="/blog" className="font-semibold text-clay underline-offset-4 hover:underline">
            guides
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
