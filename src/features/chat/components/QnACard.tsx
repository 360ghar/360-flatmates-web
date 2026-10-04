import type { HTMLAttributes } from "react";
import { CheckCircle2, Minus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/component-utils";

export interface QnAAnswer {
  name: string;
  avatarUrl?: string | null;
  text: string;
}

export interface QnACardProps extends HTMLAttributes<HTMLElement> {
  question: string;
  yourAnswer?: QnAAnswer;
  theirAnswer?: QnAAnswer;
  matched?: boolean;
}

export function QnACard({
  question,
  yourAnswer,
  theirAnswer,
  matched = false,
  className,
  ...props
}: QnACardProps) {
  const complete = Boolean(yourAnswer && theirAnswer);

  return (
    <Card as="article" className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-body-md font-semibold text-ink">{question}</h3>
        <span className={cn("text-caption", complete ? "text-pine" : "text-ink-3")}>
          {complete ? "Both answered" : "Waiting for answers"}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <AnswerBlock align="left" answer={theirAnswer} fallbackLabel="Their answer" />
        <div className="hidden md:flex md:justify-center">
          {matched ? (
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-success" />
          ) : (
            <Minus aria-hidden="true" className="h-5 w-5 text-ink-3" />
          )}
        </div>
        <AnswerBlock align="right" answer={yourAnswer} fallbackLabel="Your answer" />
      </div>
    </Card>
  );
}

function AnswerBlock({
  answer,
  fallbackLabel,
  align
}: {
  answer?: QnAAnswer;
  fallbackLabel: string;
  align: "left" | "right";
}) {
  return (
    <div className={cn("flex items-start gap-2", align === "right" && "md:flex-row-reverse md:text-right")}>
      {answer ? <Avatar name={answer.name} size="compact" src={answer.avatarUrl} /> : null}
      <div className="min-w-0">
        <p className="text-caption text-ink-3">{answer?.name ?? fallbackLabel}</p>
        <p className="mt-1 text-body-md text-ink">{answer?.text ?? "Not answered yet"}</p>
      </div>
    </div>
  );
}

