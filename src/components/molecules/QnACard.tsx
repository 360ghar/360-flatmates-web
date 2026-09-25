import type { HTMLAttributes } from "react";
import { CheckCircle2, Minus } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Card } from "../ui/Card";
import { cn } from "../ui/component-utils";

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
      <div className={cn("rounded-full px-3 py-1 text-caption font-semibold", complete ? "bg-accent-soft text-accent" : "bg-surface-soft text-ink-3")}>
        {complete ? "Both answered" : "Waiting for answers"}
      </div>
      <h3 className="text-[13px] font-semibold text-ink-2">{question}</h3>
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

