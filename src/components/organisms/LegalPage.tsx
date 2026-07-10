import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export interface LegalSection {
  title: string;
  content: string;
}

export interface LegalPageProps {
  eyebrow?: string;
  heading: string;
  updatedAt?: string;
  sections: LegalSection[];
  helmet?: ReactNode;
}

export function LegalPage({
  eyebrow = "Legal",
  heading,
  updatedAt,
  sections,
  helmet,
}: LegalPageProps) {
  return (
    <>
      {helmet}
      <main id="main" className="page-fade mx-auto max-w-3xl px-5 py-16 md:px-6">
        <div className="border-b border-line pb-8 mb-10">
          <p className="text-eyebrow text-accent uppercase tracking-widest">{eyebrow}</p>
          <h1 className="mt-4 text-display text-4xl md:text-5xl text-ink leading-tight tracking-tight">
            {heading}
          </h1>
          {updatedAt ? (
            <p className="mt-4 text-body-md text-ink-3">
              Last updated <span className="font-sans text-xs">{updatedAt}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <Card key={section.title} className="p-6 md:p-8 border border-line-low hover:border-accent/15 hover:shadow-sm transition-all duration-300">
              <h2 className="text-h3 text-ink mb-3 font-semibold">{section.title}</h2>
              <p className="max-w-[65ch] text-body-md text-ink-2 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
