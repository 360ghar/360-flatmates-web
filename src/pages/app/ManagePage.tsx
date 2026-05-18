import { Link } from "react-router";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useMyProperties } from "@/hooks/queries";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView } from "@/components/ui/StateViews";
import { ListingCard } from "@/components/molecules/ListingCard";

export function ManagePage() {
  const navigate = useNavigate();
  const { data: properties, isLoading, error, refetch } = useMyProperties();

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1">Post & Manage</h1>
        <Link to="/post">
          <Button size="compact" leadingIcon={<Plus aria-hidden="true" className="h-4 w-4" />}>
            New Listing
          </Button>
        </Link>
      </div>

      <AsyncView
        data={properties ?? []}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        loading={
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <div className="shimmer animate-shimmer motion-reduce:animate-none h-7 w-40 rounded-sm" />
              <div className="shimmer animate-shimmer motion-reduce:animate-none h-10 w-32 rounded-[10px]" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton variant="listingCard" count={3} />
            </div>
          </div>
        }
        empty={
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-body-md text-ink-2">You have not posted any listings yet.</p>
            <Link to="/post">
              <Button>Post your first listing</Button>
            </Link>
          </Card>
        }
        onRetry={() => refetch()}
      >
        {(data) => (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((property) => (
              <ListingCard
                key={property.id}
                listing={propertyToListingCardProps(property)}
                ctaLabel="Manage"
                onOpen={(id) => {
                  navigate(`/my-listings/${id}`);
                }}
                onSave={(id) => {
                  navigate(`/my-listings/${id}`);
                }}
              />
            ))}
          </div>
        )}
      </AsyncView>
    </div>
  );
}
