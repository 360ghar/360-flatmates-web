import { ChevronRight, Users } from "lucide-react";
import { Stamp } from "@/components/paper/Stamp";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn, focusRing } from "@/components/ui/component-utils";
import { formatCurrencyINR } from "@/lib/utils";

/** The sticky side sheet: rent, the host, and the two things you can do. */
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
    <aside aria-label="Contact the owner" className="hidden lg:block">
      <div className="paper-grain sticky top-24 rounded-hand bg-paper-3 p-6 shadow-md">
        <Stamp className="absolute -right-5 -top-7 size-20 rotate-12" />
        <p className="text-caption text-ink-3">Rent</p>
        <p className="mt-0.5 text-h3 font-sans font-semibold tabular-nums text-ink">
          {formatCurrencyINR(price)}
          <span className="text-body-md font-normal text-ink-3"> a month</span>
        </p>

        <button
          type="button"
          onClick={onOpenOwnerProfile}
          className={cn("mt-5 flex w-full items-center gap-3 rounded-cut-md bg-surface-soft p-3 text-left hover:bg-surface-strong", focusRing)}
        >
          <Avatar name={ownerName ?? "Host"} size="md" src={ownerAvatarUrl} />
          <span className="min-w-0 flex-1">
            <span className="block text-caption text-ink-3">Listed by</span>
            <span className="block truncate text-body-lg font-semibold text-ink">{ownerName ?? "The owner"}</span>
          </span>
          <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-3" />
        </button>

        {interestCount !== undefined ? (
          <p className="mt-4 flex items-center gap-2 text-body-md text-ink-2">
            <Users aria-hidden="true" className="h-4 w-4 text-ink-3" />
            {interestCount} {interestCount === 1 ? "person is" : "people are"} interested
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2.5">
          <Button fullWidth disabled={isOwnListing} loading={contactPending} onClick={onContactOwner}>
            {isOwnListing ? "Your listing" : "Contact owner"}
          </Button>
          <Button fullWidth variant="tertiary" onClick={onShareClick}>
            Share listing
          </Button>
        </div>
      </div>
    </aside>
  );
}
