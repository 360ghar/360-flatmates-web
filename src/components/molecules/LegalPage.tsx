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
      <main id="main" className="page-fade mx-auto max-w-3xl px-5 py-12 md:px-6">
        <p className="text-eyebrow text-accent">{eyebrow}</p>
        <h1 className="mt-3 text-h1">{heading}</h1>
        {updatedAt ? (
          <p className="mt-4 text-body-md text-ink-3">
            Last updated: {updatedAt}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-5">
          {sections.map((section) => (
            <Card key={section.title} className="p-5">
              <h2 className="text-h3">{section.title}</h2>
              <p className="mt-3 max-w-[65ch] text-body-md text-ink-2">
                {section.content}
              </p>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
