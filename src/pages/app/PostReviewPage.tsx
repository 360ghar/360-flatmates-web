import { useLocation, useNavigate, useParams } from "react-router";
import { CheckCircle2, CircleCheck, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const reviewSteps: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Submitted", icon: CheckCircle2 },
  { label: "Under Review", icon: Clock },
  { label: "Published", icon: CircleCheck }
];

export function PostReviewPage() {
  const { listingId: listingIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const listingId =
    Number.parseInt(listingIdParam ?? "", 10) ||
    (location.state as { listingId?: number } | null)?.listingId;
  const editPath = listingId ? `/my-listings/${listingId}/edit` : "/post";

  return (
    <div className="flex items-center justify-center p-4 md:p-6">
      <Card className="mx-auto max-w-lg p-6 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-warning-soft text-warning">
          <Clock aria-hidden className="size-9" />
        </div>
        <h1 className="mt-5 text-h1">Under Review</h1>
        <p className="mt-3 text-body-md text-ink-2">
          Your listing is submitted. We will review it within 24 hours.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-2 text-caption">
          {reviewSteps.map(({ label, icon: Icon }, index) => (
            <div
              key={label}
              className={`rounded-xl p-3 ${index < 2 ? "bg-accent-soft text-accent" : "bg-paper-2 text-ink-3"}`}
            >
              <Icon aria-hidden className="mx-auto mb-2 size-5" />
              {label}
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-2 text-left text-body-md text-ink-2">
          <p>1. AI pre-screen checks photos, pricing, and required fields.</p>
          <p>2. Moderation reviews the listing context.</p>
          <p>3. Approved listings receive a 24 hour launch boost.</p>
        </div>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="w-full sm:w-auto" onClick={() => navigate(editPath)}>
            Edit Listing
          </Button>
          <Button variant="tertiary" className="w-full sm:w-auto" onClick={() => navigate("/manage")}>
            Back to Manage
          </Button>
        </div>
      </Card>
    </div>
  );
}
