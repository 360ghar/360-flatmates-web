import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import type { CompatibilityDimension } from "@/lib/api/types";
import { useCompatibility } from "@/features/profile/hooks/useCompatibility";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader } from "@/components/ui/Layout";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { AsyncView, ErrorState } from "@/components/ui/StateViews";
import { CompatibilitySkeleton } from "@/features/profile/components/CompatibilitySkeleton";
import { cn } from "@/components/ui/component-utils";
import { DimensionDetailModal } from "@/features/profile/components/DimensionDetailModal";
import { DimensionRow } from "@/features/profile/components/DimensionRow";
import {
  VERDICT,
  dimensionLabel,
  findIncompleteDimensions,
  findTopOpportunity,
  valueLabel
} from "@/features/profile/lib/compatibility-view";

export function CompatibilityPage() {
  const { id } = useParams<{ id: string }>();
  const peerId = Number(id);
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useCompatibility(peerId);
  const [openDim, setOpenDim] = useState<CompatibilityDimension | null>(null);

  // useCompatibility only runs for a positive id; anything else has nothing to show.
  if (!Number.isInteger(peerId) || peerId <= 0) return <Navigate to="/home" replace />;

  return (
    <Page width="narrow">
      <PageHeader title="Compatibility" />
      <AsyncView
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        loading={<CompatibilitySkeleton />}
        empty={
          <ErrorState
            title="No score yet"
            description="We could not compare your profiles."
            onRetry={() => refetch()}
          />
        }
      >
        {(breakdown) => {
          const dimensions = breakdown.dimensions ?? [];
          const overall = breakdown.overall_percentage;
          const opportunity = overall == null ? null : findTopOpportunity(dimensions);
          const incomplete = findIncompleteDimensions(dimensions);
          const verdict = VERDICT[breakdown.color];
          const summary = breakdown.summary?.length
            ? breakdown.summary
            : [overall == null ? "Not enough shared answers to score yet." : "Based on the lifestyle answers both of you gave."];

          return (
            <>
              <Card className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left">
                <ProgressRing size="xl" value={overall ?? 0} label="Overall compatibility" />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-h2", verdict?.tone ?? "text-ink")}>
                    {overall == null ? "Add your answers to see a score" : verdict?.label ?? `${overall}% compatible`}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1 text-body-md text-ink-2">
                    {summary.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </Card>

              {opportunity && overall != null ? (
                <Card className="flex flex-col gap-2 p-5">
                  <h2 className="text-h3 text-ink">The biggest difference</h2>
                  <p className="text-body-md text-ink-2">
                    <span className="font-semibold text-ink">{dimensionLabel(opportunity.dimension.name)}</span>: you
                    said {valueLabel(opportunity.dimension, "user") ?? "nothing yet"}, they said{" "}
                    {valueLabel(opportunity.dimension, "peer")}. Agreeing here could lift the score to about{" "}
                    {Math.min(100, overall + Math.round(opportunity.delta))}%.
                  </p>
                </Card>
              ) : null}

              <Card className="flex flex-col gap-1 p-5">
                <h2 className="mb-2 text-h3 text-ink">Breakdown</h2>
                {dimensions.map((dim) => (
                  <DimensionRow key={dim.name} dimension={dim} onOpen={setOpenDim} />
                ))}
              </Card>

              {incomplete.length > 0 ? (
                <Card className="flex flex-col gap-3 p-5">
                  <h2 className="text-h3 text-ink">Not compared yet</h2>
                  <ul className="flex list-disc flex-col gap-1 pl-5 text-body-md text-ink-2 marker:text-ink-3">
                    {incomplete.map((dim) => (
                      <li key={dim.name}>
                        <span className="font-semibold text-ink">{dimensionLabel(dim.name)}</span>
                        {!dim.user_value ? ": you have not answered this" : ": they have not answered this"}
                      </li>
                    ))}
                  </ul>
                  {incomplete.some((d) => !d.user_value) ? (
                    <Button size="compact" variant="secondary" className="self-start" onClick={() => navigate("/profile/edit")}>
                      Update your profile
                    </Button>
                  ) : null}
                </Card>
              ) : null}

              <DimensionDetailModal dimension={openDim} onClose={() => setOpenDim(null)} />
            </>
          );
        }}
      </AsyncView>
    </Page>
  );
}
