import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PriceText } from "@/components/ui/PriceText";

export function ListingBookingPanel({
  price,
  ownerName,
  ownerAvatarUrl,
  interestCount,
  isOwnListing,
  contactPending,
  onOpenOwnerProfile,
  onContactOwner,
  onShareClick
}: {
  price: number;
  ownerName?: string;
  ownerAvatarUrl?: string | null;
  interestCount?: number;
  isOwnListing: boolean;
  contactPending: boolean;
  onOpenOwnerProfile: () => void;
  onContactOwner: () => void;
  onShareClick: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="sticky top-24 border-line p-5 shadow-md">
        <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="text-caption font-medium uppercase tracking-wide text-ink-3">Monthly</p>
            <PriceText
              value={price}
              variant="card"
              className="text-2xl font-semibold text-ink"
            />
          </div>
        </div>
        <button
          type="button"
          className="mb-4 flex w-full items-center gap-3 rounded-xl border border-line bg-surface-soft p-3 text-left transition-colors hover:border-accent/30"
          onClick={onOpenOwnerProfile}
        >
          <Avatar name={ownerName ?? "Host"} size="lg" src={ownerAvatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="text-caption text-ink-3">Hosted by</p>
            <h3 className="truncate text-h3 font-semibold text-ink">
              {ownerName ?? "Landlord"}
            </h3>
          </div>
          <span className="text-ink-3">→</span>
        </button>
        {interestCount !== undefined ? (
          <p className="mb-4 flex items-center gap-2 text-body-md text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {interestCount} flatmates interested
          </p>
        ) : null}
        <div className="flex flex-col gap-2.5">
          <Button
            fullWidth
            className="rounded-full font-semibold"
            disabled={isOwnListing}
            loading={contactPending}
            onClick={onContactOwner}
          >
            {isOwnListing ? "Your listing" : "Contact owner"}
          </Button>
          <Button
            fullWidth
            variant="secondary"
            className="rounded-full"
            onClick={onShareClick}
          >
            Share listing
          </Button>
        </div>
      </Card>
    </div>
  );
}
