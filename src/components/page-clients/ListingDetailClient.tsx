import { useParams } from "react-router";
import { Link } from "react-router";

import { useProperty } from "@/hooks/queries/useProperties";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, ErrorState, EmptyState } from "@/components/ui/StateViews";

export default function ListingDetailClient() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);

  const { data: property, isLoading, error, refetch } = useProperty(propertyId);

  const listing = property ? propertyToListingCardProps(property) : null;

  return (
    <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
      <AsyncView
        data={listing}
        isLoading={isLoading}
        error={error}
        loading={<Skeleton variant="listingDetail" />}
        empty={<EmptyState title="Listing not found" description="This listing may have been removed or is no longer available." />}
        errorView={<ErrorState onRetry={() => refetch()} />}
      >
        {(data) => (
          <div className="grid gap-6 lg:grid-cols-[minmax(280px,480px)_1fr]">
            <div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:max-h-[620px]">
                <NetworkImage
                  alt={data.title}
                  src={data.imageUrl}
                  wrapperClassName="h-full w-full rounded-2xl"
                />
              </div>
              {property?.image_urls && property.image_urls.length > 1 ? (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {property.image_urls.slice(1, 5).map((url, index) => (
                    <div key={`${url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper-2">
                      <NetworkImage alt="" src={url} wrapperClassName="h-full w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <section className="space-y-5">
              <div>
                <h1 className="text-h1">{data.title}</h1>
                <div className="mt-3">
                  <PriceText value={data.price} variant="hero" />
                </div>
                <p className="mt-3 text-body-lg text-ink-2">
                  {data.locality}
                  {data.city ? `, ${data.city}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.beds !== undefined && <Chip variant="info">{data.beds} beds</Chip>}
                {data.baths !== undefined && <Chip variant="info">{data.baths} baths</Chip>}
                {data.areaSqFt !== undefined && <Chip variant="info">{data.areaSqFt} sq ft</Chip>}
                {data.features?.map((item) => <Chip key={item} variant="info">{item}</Chip>)}
              </div>
              {property?.description ? (
                <Card className="p-5">
                  <h2 className="text-h2">About this Flat</h2>
                  <p className="mt-3 max-w-[65ch] text-body-lg text-ink-2">
                    {property.description}
                  </p>
                </Card>
              ) : null}
              <Card className="p-5">
                <h2 className="text-h2">Cost breakdown</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <p className="rounded-xl bg-paper-2 p-3 text-body-md">
                    Rent: {data.price}
                  </p>
                  <p className="rounded-xl bg-paper-2 p-3 text-body-md">
                    Deposit: {property?.security_deposit ?? "Contact owner"}
                  </p>
                  <p className="rounded-xl bg-paper-2 p-3 text-body-md">
                    Maintenance: {property?.maintenance_charges ?? "Included"}
                  </p>
                </div>
              </Card>
              <div className="sticky bottom-0 flex gap-3 rounded-2xl border border-line bg-surface/90 p-3 backdrop-blur-[9px]">
                <Button variant="secondary" fullWidth>
                  Save
                </Button>
                <Link to="/login" className={buttonClasses("primary", "default", true)}>
                  Contact
                </Link>
              </div>
            </section>
          </div>
        )}
      </AsyncView>
    </main>
  );
}


