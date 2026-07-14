import { useCallback, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Share } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/queries/useConversations";
import { myProfileOptions } from "@/hooks/queries/useProfiles";
import { useProperty } from "@/hooks/queries/useProperties";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import { uiStore } from "@/lib/stores/ui-store";
import { formatCurrencyINR } from "@/lib/utils/format";
import { Avatar } from "@/components/ui/Avatar";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { cn } from "@/components/ui/component-utils";
import { ShareSheet } from "@/components/organisms/ShareSheet";

export default function ListingDetailClient() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { data: property, isLoading, error, refetch } = useProperty(propertyId);
  // Only resolve "me" when signed in — public listing pages must not 401-fetch profile.
  const { data: myProfile, isLoading: isProfileLoading } = useQuery({
    ...myProfileOptions,
    enabled: Boolean(user)
  });
  const createConversation = useCreateConversation();
  const [isShareOpen, setIsShareOpen] = useState(false);
  // App shell has a ~76px bottom nav; public /discover/:id does not.
  const hasAppBottomNav = pathname.startsWith("/listing/");

  const ownerId = property?.owner?.id ?? property?.owner_id;
  const isOwnListing = Boolean(ownerId && myProfile?.id === ownerId);

  const handleOpenOwnerProfile = useCallback(() => {
    if (user && ownerId) {
      navigate(`/profile/${ownerId}`);
    } else if (ownerId) {
      navigate(`/login?redirect=${encodeURIComponent(`/profile/${ownerId}`)}`);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(`/listing/${propertyId}`)}`);
    }
  }, [navigate, ownerId, propertyId, user]);

  const handleContactOwner = useCallback(() => {
    if (!ownerId) {
      uiStore.getState().pushToast({
        type: "error",
        title: "Owner unavailable",
        description: "We could not find the owner for this listing. Please try another listing."
      });
      return;
    }

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/listing/${propertyId}`)}`);
      return;
    }

    if (isOwnListing) {
      uiStore.getState().pushToast({
        type: "info",
        title: "This is your listing",
        description: "You cannot start a conversation with yourself."
      });
      return;
    }

    createConversation.mutate(
      {
        peer_user_id: ownerId,
        context_property_id: propertyId,
        initial_message: `Hi, I am interested in ${property?.title ?? "this listing"}.`
      },
      {
        onSuccess: (conversation) => {
          navigate(`/chats/${conversation.id}`);
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not contact owner",
            description: "Something went wrong while starting the chat. Please try again."
          });
        }
      }
    );
  }, [
    createConversation,
    isOwnListing,
    navigate,
    ownerId,
    property?.title,
    propertyId,
    user
  ]);

  // Guard against invalid IDs before rendering content
  if (!params.id || isNaN(propertyId) || propertyId <= 0) {
    return (
      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
        <EmptyState
          title="Listing not found"
          description="This listing may have been removed or the URL is incorrect."
        />
        <div className="mt-6 flex justify-center">
          <Link to="/discover" className={buttonClasses("secondary", "default", true)}>
            Browse listings
          </Link>
        </div>
      </main>
    );
  }

  const listing = property ? propertyToListingCardProps(property) : null;

  return (
    <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-body-md font-medium text-ink-3 hover:text-accent transition-colors"
      >
        &larr; Back to Listings
      </button>

      <AsyncView
        data={listing}
        isLoading={isLoading}
        error={error}
        loading={<Skeleton variant="listingDetail" />}
        empty={
          <EmptyState
            title="Listing not found"
            description="This listing may have been removed or is no longer available."
          />
        }
        errorView={
          <ErrorState
            title="Could not load listing"
            description="We couldn't fetch this listing. It may not exist or the server may be unavailable."
            onRetry={() => refetch()}
          />
        }
      >
        {(data) => {
          const extraPhotos = (property?.image_urls ?? []).filter(
            (url) => url && url !== data.imageUrl
          ).slice(0, 2);
          const hasGallery = extraPhotos.length > 0;

          return (
          <div className="space-y-8 pb-24 lg:pb-0">
            {/* Photo gallery — no empty placeholders */}
            <div className={hasGallery ? "grid gap-2 md:grid-cols-3 md:grid-rows-2 md:h-[420px]" : ""}>
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-line bg-surface-soft shadow-md",
                  hasGallery
                    ? "aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto md:h-full"
                    : "aspect-[16/10] w-full"
                )}
              >
                <NetworkImage
                  alt={data.title}
                  src={data.imageUrl}
                  wrapperClassName="h-full w-full rounded-2xl"
                  className="hover:scale-[1.02] transition-transform duration-700 ease-out"
                />
                {data.compatibilityScore !== undefined && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/50 bg-surface/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2">Match</span>
                    <ProgressRing value={data.compatibilityScore} size="sm" showValue label="Compatibility score" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="absolute top-4 right-4 rounded-full border border-white/50 bg-surface/95 p-2.5 text-ink shadow-md backdrop-blur-sm hover:text-accent"
                  aria-label="Share this listing"
                >
                  <Share className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              {hasGallery
                ? extraPhotos.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative hidden min-h-0 overflow-hidden rounded-2xl border border-line bg-surface-soft shadow-sm md:block md:h-full"
                    >
                      <NetworkImage
                        alt=""
                        src={url}
                        wrapperClassName="h-full w-full rounded-2xl"
                        className="hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))
                : null}
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm md:p-6">
                  <PriceText
                    value={data.price}
                    variant="card"
                    className="text-2xl font-semibold text-ink md:text-3xl"
                  />
                  <h1 className="mt-2 text-h1 leading-tight text-ink">{data.title}</h1>
                  <div className="mt-2 flex items-center gap-1.5 text-body-md text-ink-3">
                    <MapPin className="h-4 w-4 shrink-0 text-ink-4" />
                    <span>
                      {data.locality}
                      {data.city ? `, ${data.city}` : ""}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {data.beds !== undefined && (
                      <Chip variant="info" className="cursor-default border-0 bg-blue-soft px-3 py-1.5 font-semibold text-blue-ink">
                        {data.beds} Bed
                      </Chip>
                    )}
                    {data.baths !== undefined && (
                      <Chip variant="info" className="cursor-default border-0 bg-teal-soft px-3 py-1.5 font-medium text-teal-ink">
                        {data.baths} Bath
                      </Chip>
                    )}
                    {data.areaSqFt !== undefined && (
                      <Chip variant="info" className="cursor-default border-0 bg-purple-soft px-3 py-1.5 font-medium text-purple-ink">
                        {data.areaSqFt} sq ft
                      </Chip>
                    )}
                    {property?.sharing_type && (
                      <Chip variant="info" className="cursor-default border-0 bg-accent-soft px-3 py-1.5 font-semibold capitalize text-accent">
                        {property.sharing_type.replace("_", " ")}
                      </Chip>
                    )}
                    {property?.gender_preference && (
                      <Chip variant="info" className="cursor-default border border-line bg-surface-soft px-3 py-1.5 font-medium capitalize text-ink-2">
                        {property.gender_preference === "any" ? "Open to both" : property.gender_preference}
                      </Chip>
                    )}
                    {property?.available_from && (
                      <Chip variant="info" className="cursor-default border border-line bg-surface-soft px-3 py-1.5 font-medium text-ink-2">
                        From{" "}
                        {new Date(property.available_from).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Chip>
                    )}
                    {data.features?.slice(0, 6).map((item) => (
                      <Chip key={item} variant="info" className="cursor-default border border-line bg-surface px-3 py-1.5 text-ink-2">
                        {item}
                      </Chip>
                    ))}
                  </div>
                </div>

                {property?.description ? (
                  <Card className="border-line p-5 shadow-sm md:p-6">
                    <h2 className="text-h3 font-semibold text-ink">About this flat</h2>
                    <p className="mt-3 max-w-[65ch] whitespace-pre-line text-body-lg leading-relaxed text-ink-2">
                      {property.description}
                    </p>
                  </Card>
                ) : null}

                <Card className="border-line p-5 shadow-sm md:p-6">
                  <h2 className="text-h3 font-semibold text-ink">Cost breakdown</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-line bg-surface-soft p-4 text-center">
                      <p className="text-caption font-medium uppercase tracking-wide text-ink-3">Monthly rent</p>
                      <PriceText
                        value={data.price}
                        variant="inline"
                        suffix=""
                        className="mt-1 block text-h2 font-semibold text-accent"
                      />
                    </div>
                    <div className="rounded-xl border border-line bg-surface-soft p-4 text-center">
                      <p className="text-caption font-medium uppercase tracking-wide text-ink-3">Deposit</p>
                      <p className="mt-1 text-h2 font-semibold text-ink">
                        {property?.security_deposit ? formatCurrencyINR(property.security_deposit) : "TBD"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface-soft p-4 text-center">
                      <p className="text-caption font-medium uppercase tracking-wide text-ink-3">Maintenance</p>
                      <p className="mt-1 text-h2 font-semibold text-ink">
                        {property?.maintenance_charges
                          ? formatCurrencyINR(property.maintenance_charges)
                          : "None"}
                      </p>
                    </div>
                  </div>
                </Card>

                {property?.society_type ||
                (property?.society_amenities && property.society_amenities.length > 0) ||
                (property?.society_vibe_tags && property.society_vibe_tags.length > 0) ? (
                  <Card className="border-line p-5 shadow-sm md:p-6">
                    <h2 className="text-h3 font-semibold text-ink">Society & vibe</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {property?.society_type && (
                        <div className="rounded-xl border border-line bg-surface-soft p-4">
                          <p className="text-caption font-medium uppercase tracking-wide text-ink-3">Society type</p>
                          <p className="mt-1 text-body-lg font-medium capitalize text-ink">
                            {property.society_type.replace("_", " ")}
                          </p>
                        </div>
                      )}
                      {property?.society_amenities && property.society_amenities.length > 0 && (
                        <div className="rounded-xl border border-line bg-surface-soft p-4 md:col-span-2">
                          <p className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-3">
                            Amenities
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {property.society_amenities.map((a) => (
                              <Chip key={a} variant="info" className="cursor-default border border-line bg-surface px-3 py-1 text-ink-2">
                                {a}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}
                      {property?.society_vibe_tags && property.society_vibe_tags.length > 0 && (
                        <div className="rounded-xl border border-line bg-surface-soft p-4 md:col-span-2">
                          <p className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-3">Vibe</p>
                          <div className="flex flex-wrap gap-1.5">
                            {property.society_vibe_tags.map((t) => (
                              <Chip
                                key={t}
                                variant="info"
                                className="cursor-default border border-accent/15 bg-accent-soft px-3 py-1 text-accent"
                              >
                                #{t}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ) : null}
              </div>

              {/* Sticky booking / host column */}
              <div className="space-y-4">
                <Card className="sticky top-24 border-line p-5 shadow-md">
                  <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-4">
                    <div>
                      <p className="text-caption font-medium uppercase tracking-wide text-ink-3">Monthly</p>
                      <PriceText
                        value={data.price}
                        variant="card"
                        className="text-2xl font-semibold text-ink"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mb-4 flex w-full items-center gap-3 rounded-xl border border-line bg-surface-soft p-3 text-left transition-colors hover:border-accent/30"
                    onClick={handleOpenOwnerProfile}
                  >
                    <Avatar name={data.owner?.name ?? "Host"} size="lg" src={data.owner?.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="text-caption text-ink-3">Hosted by</p>
                      <h3 className="truncate text-h3 font-semibold text-ink">
                        {data.owner?.name ?? "Landlord"}
                      </h3>
                    </div>
                    <span className="text-ink-3">→</span>
                  </button>
                  {data.interestCount !== undefined ? (
                    <p className="mb-4 flex items-center gap-2 text-body-md text-ink-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {data.interestCount} flatmates interested
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-2.5">
                    <Button
                      fullWidth
                      className="rounded-full font-semibold"
                      disabled={isOwnListing}
                      loading={isProfileLoading || createConversation.isPending}
                      onClick={handleContactOwner}
                    >
                      {isOwnListing ? "Your listing" : "Contact owner"}
                    </Button>
                    <Button
                      fullWidth
                      variant="secondary"
                      className="rounded-full"
                      onClick={() => setIsShareOpen(true)}
                    >
                      Share listing
                    </Button>
                  </div>
                </Card>
              </div>
            </div>

            {/* Mobile sticky CTA — clear AppShell bottom nav when on /listing/* */}
            <div
              className={cn(
                "fixed inset-x-0 z-[var(--z-sticky)] border-t border-line bg-surface/95 p-3 backdrop-blur-xl lg:hidden",
                hasAppBottomNav
                  ? "bottom-[calc(76px+env(safe-area-inset-bottom))]"
                  : "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
              )}
            >
              <div className="mx-auto flex max-w-7xl items-center gap-3">
                <div className="min-w-0 flex-1">
                  <PriceText value={data.price} variant="card" className="font-semibold text-ink" />
                </div>
                <Button
                  className="shrink-0 rounded-full px-5"
                  disabled={isOwnListing}
                  loading={isProfileLoading || createConversation.isPending}
                  onClick={handleContactOwner}
                >
                  {isOwnListing ? "Yours" : "Contact"}
                </Button>
              </div>
            </div>

          {property && (
            <ShareSheet
              property={property}
              open={isShareOpen}
              onClose={() => setIsShareOpen(false)}
            />
          )}
        </div>
          );
        }}
      </AsyncView>
    </main>
  );
}


