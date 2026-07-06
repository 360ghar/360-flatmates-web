import { useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { MapPin } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/queries/useConversations";
import { useMyProfile } from "@/hooks/queries/useProfiles";
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

export default function ListingDetailClient() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: property, isLoading, error, refetch } = useProperty(propertyId);
  const { data: myProfile, isLoading: isProfileLoading } = useMyProfile();
  const createConversation = useCreateConversation();
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

    if (isProfileLoading) {
      uiStore.getState().pushToast({
        type: "info",
        title: "Profile still loading",
        description: "Please wait a moment before contacting the owner."
      });
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
  }, [createConversation, isOwnListing, isProfileLoading, navigate, ownerId, property?.title, propertyId, user]);

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
        {(data) => (
          <div className="space-y-6">
            {/* Elegant Image Gallery Section */}
            <div className="grid gap-3 md:grid-cols-3">
              {/* Main large image */}
              <div className="relative md:col-span-2 aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                <NetworkImage
                  alt={data.title}
                  src={data.imageUrl}
                  wrapperClassName="h-full w-full rounded-2xl"
                  className="hover:scale-[1.02] transition-transform duration-700 ease-out"
                />
                {data.compatibilityScore !== undefined && (
                  <div className="absolute top-4 left-4 rounded-full bg-surface/95 px-3.5 py-1.5 shadow-md border border-line-low flex items-center gap-2 animate-scale-in">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-ink-2 font-bold">Compatibility</span>
                    <ProgressRing value={data.compatibilityScore} size="sm" showValue={true} label="Compatibility score" />
                  </div>
                )}
              </div>

              {/* Small images grid column */}
              <div className="grid grid-rows-2 gap-3">
                {property?.image_urls && property.image_urls.length > 1 ? (
                  property.image_urls.slice(1, 3).map((url, index) => (
                    <div key={`${url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-paper-2 shadow-xs">
                      <NetworkImage
                        alt=""
                        src={url}
                        wrapperClassName="h-full w-full rounded-2xl"
                        className="hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-paper-2/50 flex items-center justify-center text-ink-4">
                      <span className="text-caption font-medium">No additional photos</span>
                    </div>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-paper-2/50 flex items-center justify-center text-ink-4">
                      <span className="text-caption font-medium">No additional photos</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Two column detail layout */}
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              {/* Left Column: Details, description, cost breakdown */}
              <div className="space-y-6">
                <div className="border-b border-line pb-5">
                  <h1 className="text-display font-serif font-normal text-3xl leading-tight text-ink">{data.title}</h1>
                  
                  <div className="flex items-center gap-1.5 mt-3 text-body-lg text-ink-2">
                    <MapPin className="h-5 w-5 text-accent shrink-0" />
                    <span>{data.locality}{data.city ? `, ${data.city}` : ""}</span>
                  </div>
                </div>

                {/* Property info chips */}
                <div className="flex flex-wrap gap-2.5">
                  {data.beds !== undefined && (
                    <Chip variant="info" className="bg-accent-soft/40 border-[0.5px] border-accent/20 px-3.5 py-1.5 text-accent font-semibold">
                      {data.beds} Bedrooms
                    </Chip>
                  )}
                  {data.baths !== undefined && (
                    <Chip variant="info" className="bg-paper-2 border-[0.5px] border-line px-3.5 py-1.5 text-ink-2 font-medium">
                      {data.baths} Bathrooms
                    </Chip>
                  )}
                  {data.areaSqFt !== undefined && (
                    <Chip variant="info" className="bg-paper-2 border-[0.5px] border-line px-3.5 py-1.5 text-ink-2 font-medium">
                      {data.areaSqFt} Sq Ft
                    </Chip>
                  )}
                  {property?.sharing_type && (
                    <Chip variant="info" className="bg-accent-soft/30 border-[0.5px] border-accent/15 px-3.5 py-1.5 text-accent font-semibold capitalize">
                      {property.sharing_type.replace("_", " ")}
                    </Chip>
                  )}
                  {property?.gender_preference && (
                    <Chip variant="info" className="bg-paper-2 border-[0.5px] border-line px-3.5 py-1.5 text-ink-2 font-medium capitalize">
                      Preference: {property.gender_preference === "any" ? "Open to Both" : property.gender_preference}
                    </Chip>
                  )}
                  {property?.available_from && (
                    <Chip variant="info" className="bg-paper-2 border-[0.5px] border-line px-3.5 py-1.5 text-ink-2 font-medium">
                      Available: {new Date(property.available_from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </Chip>
                  )}
                  {data.features?.map((item) => (
                    <Chip key={item} variant="info" className="bg-paper border-[0.5px] border-line px-3.5 py-1.5 text-ink-2 font-medium">
                      {item}
                    </Chip>
                  ))}
                </div>

                {/* Description */}
                {property?.description ? (
                  <div className="space-y-3">
                    <h2 className="text-h2 text-ink">About this flat</h2>
                    <p className="max-w-[65ch] text-body-lg text-ink-2 leading-relaxed whitespace-pre-line">
                      {property.description}
                    </p>
                  </div>
                ) : null}

                {/* Cost breakdown */}
                <Card className="p-6 bg-paper-2/30 border-line">
                  <h2 className="text-h3 font-serif font-normal text-xl text-ink">Cost breakdown</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-line bg-surface p-4 text-center">
                      <p className="text-caption text-ink-3 uppercase tracking-wider font-mono">Monthly Rent</p>
                      <PriceText
                        value={data.price}
                        variant="inline"
                        suffix=""
                        className="block text-h2 font-serif font-normal text-accent mt-1"
                      />
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-4 text-center">
                      <p className="text-caption text-ink-3 uppercase tracking-wider font-mono">Security Deposit</p>
                      <p className="text-h2 font-serif font-normal text-ink mt-1">
                        {property?.security_deposit ? formatCurrencyINR(property.security_deposit) : "TBD"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-4 text-center">
                      <p className="text-caption text-ink-3 uppercase tracking-wider font-mono">Maintenance</p>
                      <p className="text-h2 font-serif font-normal text-ink mt-1">
                        {property?.maintenance_charges ? `${formatCurrencyINR(property.maintenance_charges)}` : "None"}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Society & Vibe details */}
                {property?.society_type || (property?.society_amenities && property.society_amenities.length > 0) || (property?.society_vibe_tags && property.society_vibe_tags.length > 0) ? (
                  <Card className="p-6 bg-paper-2/30 border-line">
                    <h2 className="text-h3 font-serif font-normal text-xl text-ink">Society & Vibe</h2>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      {property?.society_type && (
                        <div className="rounded-xl border border-line bg-surface p-4">
                          <p className="text-caption text-ink-3 uppercase tracking-wider font-mono">Society Type</p>
                          <p className="text-body-lg text-ink font-medium mt-1 capitalize">{property.society_type.replace("_", " ")}</p>
                        </div>
                      )}
                      {property?.society_amenities && property.society_amenities.length > 0 && (
                        <div className="md:col-span-2 rounded-xl border border-line bg-surface p-4">
                          <p className="text-caption text-ink-3 uppercase tracking-wider font-mono mb-2">Society Amenities</p>
                          <div className="flex flex-wrap gap-1.5">
                            {property.society_amenities.map(a => (
                              <Chip key={a} className="bg-paper text-ink-2 border-[0.5px] border-line px-3 py-1">
                                {a}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}
                      {property?.society_vibe_tags && property.society_vibe_tags.length > 0 && (
                        <div className="md:col-span-2 rounded-xl border border-line bg-surface p-4">
                          <p className="text-caption text-ink-3 uppercase tracking-wider font-mono mb-2">Society Vibe</p>
                          <div className="flex flex-wrap gap-1.5">
                            {property.society_vibe_tags.map(t => (
                              <Chip key={t} className="bg-accent-soft/30 text-accent border-[0.5px] border-accent/15 px-3 py-1">
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

              {/* Right Column: Sticky Host Card & Contact Actions */}
              <div className="space-y-6">
                <Card className="p-5 sticky top-24 border border-line bg-surface shadow-sm">
                  {/* Host Section */}
                  <button
                    type="button"
                    className="flex items-center gap-3 border-b border-line pb-4 mb-4 w-full text-left hover:opacity-80 transition-opacity"
                    onClick={handleOpenOwnerProfile}
                  >
                    <div className="relative">
                      <Avatar name={data.owner?.name ?? "Host"} size="lg" src={data.owner?.avatarUrl} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-h3 font-semibold text-ink leading-tight mt-0.5">
                        {data.owner?.name ?? "Landlord"}
                      </h3>
                    </div>
                    <span className="text-ink-3 text-sm">→</span>
                  </button>

                  {/* Engagement signal — only when real data exists */}
                  {data.interestCount !== undefined ? (
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-2 text-body-md text-ink-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>{data.interestCount} flatmates interested</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Actions inside the host card */}
                  <div className="flex flex-col gap-3">
                    <Button
                      fullWidth
                      className="py-2.5 font-semibold"
                      disabled={isOwnListing || isProfileLoading}
                      loading={createConversation.isPending}
                      onClick={handleContactOwner}
                    >
                      {isOwnListing ? "Your listing" : "Contact Owner"}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </AsyncView>
    </main>
  );
}


