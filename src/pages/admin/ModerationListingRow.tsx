import { Link } from "react-router";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buttonClasses } from "@/components/ui/component-utils";
import { Card } from "@/components/ui/Card";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";
import type { FlatmateListingAdmin } from "@/lib/api/types";

const statusMap: Record<string, "pending" | "confirmed" | "rejected"> = {
  pending_review: "pending",
  approved: "confirmed",
  rejected: "rejected"
};

export function ModerationListingRow({
  listing,
  onApprove,
  onReject,
  isActing,
  actionsDisabled
}: {
  listing: FlatmateListingAdmin;
  onApprove: () => void;
  onReject: () => void;
  isActing: boolean;
  actionsDisabled: boolean;
}) {
  return (
    <Card as="div" variant="compact">
      <div className="flex items-start gap-3">
        <NetworkImage
          src={listing.main_image_url}
          alt={listing.title}
          wrapperClassName="h-16 w-16 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-body-lg font-semibold text-ink">
                {listing.title}
              </h3>
              <p className="text-caption text-ink-2">
                by {listing.owner_name} &middot; {listing.locality},{" "}
                {listing.city}
              </p>
            </div>
            <Badge
              variant="status"
              status={statusMap[listing.moderation_status] ?? "pending"}
            />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <PriceText value={listing.monthly_rent} variant="inline" />
            {listing.created_at && (
              <span suppressHydrationWarning className="text-caption text-ink-3">
                {new Date(listing.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <div className="relative z-10 mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Button
              size="compact"
              variant="primary"
              className="w-full sm:w-auto"
              loading={isActing}
              disabled={actionsDisabled && !isActing}
              leadingIcon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
              onClick={onApprove}
            >
              Approve
            </Button>
            <Button
              size="compact"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={actionsDisabled}
              leadingIcon={<XCircle aria-hidden="true" className="h-4 w-4" />}
              onClick={onReject}
            >
              Reject
            </Button>
            <Link
              to={`/admin/moderation/prescreen/${listing.id}`}
              className={buttonClasses("tertiary", "compact", false) + " w-full sm:w-auto"}
            >
              <Eye aria-hidden="true" className="h-4 w-4" />
              <span className="truncate">Review</span>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
