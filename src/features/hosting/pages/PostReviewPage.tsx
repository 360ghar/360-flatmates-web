import { useLocation, useNavigate, useParams } from "react-router";
import { PaperMiniScene } from "@/components/paper/PaperScene";
import { Button } from "@/components/ui/Button";
import { StepProgress } from "@/components/ui/StepProgress";

const WHAT_HAPPENS = [
  "An automatic check looks at the photos, the rent and the required details.",
  "A person from our team reviews the listing.",
  "Once it is approved, it goes live with a 24-hour boost."
];

/** After publishing: the listing waits for review; say what happens next. */
export function PostReviewPage() {
  const { listingId: listingIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const listingId = Number.parseInt(listingIdParam ?? "", 10) || (location.state as { listingId?: number } | null)?.listingId;
  const editPath = listingId ? `/my-listings/${listingId}/edit` : "/post";

  return (
    <div className="page-fade paper-grain rounded-hand bg-surface p-6 text-center shadow-sm sm:p-10">
      <PaperMiniScene prop="house" className="mx-auto w-[70%] max-w-[240px]" />
      <h1 className="mt-6 text-h1 text-ink">Your listing is in review</h1>
      <p className="mx-auto mt-3 max-w-[44ch] text-body-lg text-ink-2">
        We check every listing within 24 hours. You get a notification when it goes live.
      </p>
      <StepProgress
        className="mx-auto mt-8 max-w-[360px] text-left"
        aria-label="Review progress"
        totalSteps={3}
        currentStep={1}
        labels={["Submitted", "In review", "Live"]}
      />
      <ol className="mx-auto mt-8 flex max-w-[44ch] list-decimal flex-col gap-2 pl-5 text-left text-body-lg text-ink-2 marker:text-ink-3">
        {WHAT_HAPPENS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={() => navigate("/manage")}>Your listings</Button>
        <Button variant="tertiary" onClick={() => navigate(editPath)}>
          Edit listing
        </Button>
      </div>
    </div>
  );
}
