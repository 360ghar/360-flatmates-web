import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { useProperty } from "@/hooks/queries";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { ListingCard } from "@/components/molecules/ListingCard";

const PROPERTY_STATUS_LABEL: Record<string, string> = {
  approved: "Published",
  pending_review: "Under Review",
};

export function MyListingDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const listingId = params.id as string;

  const { data: property, isLoading, error, refetch } = useProperty(Number(listingId));

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 page-fade">
        <Skeleton variant="card" className="h-64" />
        <Skeleton variant="listItem" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center page-fade">
        <ErrorState onRetry={() => refetch()} title="Could not load listing" description="Please try again." />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center page-fade">
        <EmptyState
          title="Listing not found"
          description="This listing may have been removed or you don't have access."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center justify-between">
        <Button
          variant="icon"
          size="icon"
          onClick={() => navigate("/manage")}
          aria-label="Back to listings"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <Button
          variant="secondary"
          size="compact"
          leadingIcon={<Pencil aria-hidden="true" className="h-4 w-4" />}
          onClick={() => navigate(`/my-listings/${listingId}/edit`)}
        >
          Edit
        </Button>
      </div>

      <ListingCard
        listing={propertyToListingCardProps(property)}
        onOpen={() => {}}
      />

      <Card className="p-5">
        <h2 className="text-h3 mb-3">Listing Status</h2>
        <div className="flex flex-col gap-2 text-body-md text-ink-2">
          <p>
            <span className="font-semibold text-ink">Status:</span>{" "}
            {PROPERTY_STATUS_LABEL[property.property_status ?? ""] ?? "Draft"}
          </p>
          <p>
            <span className="font-semibold text-ink">Views:</span> {property.view_count ?? 0}
          </p>
          <p>
            <span className="font-semibold text-ink">Interested:</span> {property.interest_count ?? 0}
          </p>
        </div>
      </Card>
    </div>
  );
}
