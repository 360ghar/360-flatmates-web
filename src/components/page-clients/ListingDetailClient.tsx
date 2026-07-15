import { useCallback, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/queries/useConversations";
import { myProfileOptions } from "@/hooks/queries/useProfiles";
import { useProperty } from "@/hooks/queries/useProperties";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { PriceText } from "@/components/ui/PriceText";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { cn, buttonClasses } from "@/components/ui/component-utils";
import { ShareSheet } from "@/components/organisms/ShareSheet";
import { ListingPhotoGallery } from "./ListingPhotoGallery";
import { ListingCostBreakdown } from "./ListingCostBreakdown";
import { ListingSocietyVibeCard } from "./ListingSocietyVibeCard";
import { ListingBookingPanel } from "./ListingBookingPanel";

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

          return (
          <div className="space-y-8 pb-24 lg:pb-0">
            {/* Photo gallery — no empty placeholders */}
            <ListingPhotoGallery
              title={data.title}
              imageUrl={data.imageUrl}
              compatibilityScore={data.compatibilityScore}
              extraPhotos={extraPhotos}
              onShareClick={() => setIsShareOpen(true)}
            />

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

                <ListingCostBreakdown
                  price={data.price}
                  securityDeposit={property?.security_deposit}
                  maintenanceCharges={property?.maintenance_charges}
                />

                {property ? <ListingSocietyVibeCard property={property} /> : null}
              </div>

              {/* Sticky booking / host column */}
              <ListingBookingPanel
                price={data.price}
                ownerName={data.owner?.name}
                ownerAvatarUrl={data.owner?.avatarUrl}
                interestCount={data.interestCount}
                isOwnListing={isOwnListing}
                contactPending={isProfileLoading || createConversation.isPending}
                onOpenOwnerProfile={handleOpenOwnerProfile}
                onContactOwner={handleContactOwner}
                onShareClick={() => setIsShareOpen(true)}
              />
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


