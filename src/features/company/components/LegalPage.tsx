import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageBand } from "@/components/ui/Layout";
import { cn, focusRing } from "@/components/ui/component-utils";

export interface LegalSection {
  title: string;
  content: string;
}

export interface LegalPageProps {
  heading: string;
  updatedAt?: string;
  sections: LegalSection[];
  helmet?: ReactNode;
}

function anchorFor(title: string) {
  return title.toLowerCase().replace(/^\d+\.\s*/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function Contents({ sections, className }: { sections: LegalSection[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {sections.map((section) => (
        <li key={section.title}>
          <a
            href={`#${anchorFor(section.title)}`}
            className={cn("flex min-h-11 items-center rounded-cut-sm px-2 text-body-md text-ink-2 hover:bg-surface-soft hover:text-ink", focusRing)}
          >
            {section.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Terms and Privacy: one readable column with anchors and a contents list. */
export function LegalPage({ heading, updatedAt, sections, helmet }: LegalPageProps) {
  return (
    <>
      {helmet}
      <PageBand
        title={heading}
        description={updatedAt ? `Last updated ${updatedAt}` : undefined}
        above={<Breadcrumbs items={[{ label: "Home", to: "/" }, { label: heading }]} />}
      />
      <div className="page-container page-fade grid gap-8 py-10 md:py-14 lg:grid-cols-12 lg:gap-10">
        <nav aria-label="On this page" className="lg:col-span-4">
          <details className="paper-grain rounded-hand bg-surface p-2 shadow-xs lg:hidden">
            <summary className={cn("flex min-h-11 cursor-pointer list-none items-center justify-between px-2 text-body-lg font-semibold text-ink [&::-webkit-details-marker]:hidden", focusRing)}>
              On this page
              <ChevronDown aria-hidden="true" className="h-5 w-5 text-ink-3" />
            </summary>
            <Contents sections={sections} className="mt-1" />
          </details>
          <div className="sticky top-28 hidden lg:block">
            <p className="px-2 text-label-lg text-ink">On this page</p>
            <Contents sections={sections} className="mt-2" />
          </div>
        </nav>

        <article className="paper-grain rounded-hand bg-surface p-6 shadow-sm md:p-10 lg:col-span-8">
          {sections.map((section, index) => (
            <section key={section.title} id={anchorFor(section.title)} className={cn("scroll-mt-28", index > 0 && "mt-10")}>
              <h2 className="text-h2 text-ink">{section.title}</h2>
              <p className="mt-3 max-w-[68ch] whitespace-pre-line text-body-lg text-ink-2">{section.content}</p>
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
