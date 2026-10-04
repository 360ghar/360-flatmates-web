import { useCallback, useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Flag, MapPin } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/features/chat/hooks/useConversations";
import { useReportUserMutation } from "@/hooks/queries/useReports";
import { ReportUserModal } from "@/features/chat/components/ReportUserModal";
import type { ChatReportReason } from "@/features/chat/lib/types";
import { myProfileOptions } from "@/hooks/queries/useProfiles";
import { useProperty } from "@/features/listings/hooks/useProperties";
import { propertyToListingCardProps } from "@/features/listings/lib/adapters";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { PageChromeContext, PageContainer, useBack } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { cn, buttonClasses } from "@/components/ui/component-utils";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { ShareSheet } from "./ShareSheet";
import { ListingPhotoGallery } from "./ListingPhotoGallery";
import { ListingCostBreakdown } from "./ListingCostBreakdown";
import { ListingSocietyVibeCard } from "./ListingSocietyVibeCard";
import { ListingBookingPanel } from "./ListingBookingPanel";

/** "private_room" -> "Private room". */
function sentence(value: string) {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function ListingDetailClient() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: property, isLoading, error, refetch } = useProperty(propertyId);
  // Only resolve "me" when signed in — public listing pages must not 401-fetch profile.
  const { data: myProfile, isLoading: isProfileLoading } = useQuery({
    ...myProfileOptions,
    enabled: Boolean(user)
  });
  const createConversation = useCreateConversation();
  const reportListing = useReportUserMutation();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ChatReportReason>("spam");
  const [reportNotes, setReportNotes] = useState("");
  // Inside the app shell the phone tab bar sits under the sticky contact bar.
  const { shell: hasAppBottomNav, titleInTopBar } = useContext(PageChromeContext);
  const goBack = useBack(hasAppBottomNav ? "/explore" : "/discover");

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

  const handleOpenReport = useCallback(() => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/listing/${propertyId}`)}`);
      return;
    }
    setIsReportOpen(true);
  }, [navigate, propertyId, user]);

  const handleSubmitReport = useCallback(() => {
    reportListing.mutate(
      {
        property_id: propertyId,
        ...(ownerId ? { reported_user_id: ownerId } : {}),
        reason: reportReason,
        notes: reportNotes.trim() || undefined
      },
      {
        onSuccess: () => {
          uiStore.getState().pushToast({ type: "success", title: "Report submitted" });
        },
        onError: () => {
          uiStore.getState().pushToast({ type: "error", title: "Could not submit report" });
        }
      }
    );
    setIsReportOpen(false);
    setReportReason("spam");
    setReportNotes("");
  }, [ownerId, propertyId, reportListing, reportNotes, reportReason]);

  // Guard against invalid IDs before rendering content
  if (!params.id || isNaN(propertyId) || propertyId <= 0) {
    return (
      <PageContainer className="page-fade py-10">
        <EmptyState
          scene="house"
          title="Listing not found"
          description="This listing may have been removed or the link is wrong."
        />
        <div className="mt-2 flex justify-center">
          <Link to="/discover" className={buttonClasses("secondary")}>
            Browse rooms
          </Link>
        </div>
      </PageContainer>
    );
  }

  const listing = property ? propertyToListingCardProps(property) : null;

  return (
    <PageContainer className="page-fade py-6 md:py-8">
      <Button
        variant="tertiary"
        size="compact"
        onClick={goBack}
        leadingIcon={<ArrowLeft aria-hidden="true" className="h-4 w-4" />}
        className={cn("-ml-4 mb-4", titleInTopBar && "max-md:hidden")}
      >
        Back
      </Button>

      <AsyncView
        data={listing}
        isLoading={isLoading}
        error={error}
        loading={<Skeleton variant="listingDetail" />}
        empty={
          <EmptyState scene="house" title="Listing not found" description="This listing may have been removed or is no longer available." />
        }
        errorView={
          <ErrorState title="Could not load this listing" description="Check your connection and try again." onRetry={() => refetch()} />
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
                <div className="paper-grain rounded-hand bg-surface p-5 shadow-sm md:p-7">
                  <p className="text-h3 font-sans font-semibold tabular-nums text-ink">
                    {formatCurrencyINR(data.price)}
                    <span className="text-body-lg font-normal text-ink-3"> a month</span>
                  </p>
                  <h1 className="mt-2 text-h1 text-ink">{data.title}</h1>
                  <p className="mt-2 flex items-center gap-1.5 text-body-lg text-ink-2">
                    <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-3" />
                    {data.locality}
                    {data.city ? `, ${data.city}` : ""}
                  </p>
                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    {[
                      ["Bedrooms", data.beds],
                      ["Bathrooms", data.baths],
                      ["Area", data.areaSqFt !== undefined ? `${data.areaSqFt} sq ft` : undefined],
                      ["Sharing", property?.sharing_type ? sentence(property.sharing_type) : undefined],
                      ["For", property?.gender_preference ? (property.gender_preference === "any" ? "Anyone" : sentence(property.gender_preference)) : undefined],
                      ["Available from", property?.available_from ? formatDate(property.available_from) : undefined]
                    ]
                      .filter(([, value]) => value !== undefined && value !== null && value !== "")
                      .map(([label, value]) => (
                        <div key={String(label)}>
                          <dt className="text-caption text-ink-3">{label}</dt>
                          <dd className="mt-0.5 text-body-lg font-semibold tabular-nums text-ink">{value}</dd>
                        </div>
                      ))}
                  </dl>
                  {data.features && data.features.length > 0 ? (
                    <>
                      <h2 className="mt-7 text-h3 text-ink">What is included</h2>
                      <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        {data.features.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-body-lg text-ink-2">
                            <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-pine" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>

                {property?.description ? (
                  <div className="paper-grain rounded-hand bg-surface p-5 shadow-sm md:p-7">
                    <h2 className="text-h3 text-ink">About this flat</h2>
                    <p className="mt-3 max-w-[65ch] whitespace-pre-line text-body-lg text-ink-2">{property.description}</p>
                  </div>
                ) : null}

                <ListingCostBreakdown
                  price={data.price}
                  securityDeposit={property?.security_deposit}
                  maintenanceCharges={property?.maintenance_charges}
                />

                {property ? <ListingSocietyVibeCard property={property} /> : null}

                {isOwnListing ? null : (
                  <div className="flex justify-end">
                    <Button
                      variant="tertiary"
                      size="compact"
                      leadingIcon={<Flag aria-hidden="true" className="h-4 w-4" />}
                      onClick={handleOpenReport}
                      loading={reportListing.isPending}
                    >
                      Report listing
                    </Button>
                  </div>
                )}
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

            {/* Phone contact bar: above the tab bar in the app, at the bottom in public. */}
            <div
              className={cn(
                "paper-grain fixed inset-x-0 z-[var(--z-sticky)] bg-paper-1 px-[var(--gutter)] py-3 shadow-[0_-1px_0_var(--color-edge),0_-3px_6px_-4px_rgb(35_32_28/0.14)] lg:hidden",
                hasAppBottomNav
                  ? "bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] md:bottom-0"
                  : "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
              )}
            >
              <div className="mx-auto flex max-w-[var(--page-max)] items-center gap-3">
                <p className="min-w-0 flex-1 text-h4 tabular-nums text-ink">
                  {formatCurrencyINR(data.price)}
                  <span className="text-body-md font-normal text-ink-3"> a month</span>
                </p>
                <Button
                  className="shrink-0"
                  disabled={isOwnListing}
                  loading={isProfileLoading || createConversation.isPending}
                  onClick={handleContactOwner}
                >
                  {isOwnListing ? "Your listing" : "Contact owner"}
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

          {property && (
            <ReportUserModal
              open={isReportOpen}
              participantName={property.title ?? "this listing"}
              reportReason={reportReason}
              onReportReasonChange={setReportReason}
              reportNotes={reportNotes}
              onReportNotesChange={setReportNotes}
              onClose={() => setIsReportOpen(false)}
              onSubmit={handleSubmitReport}
            />
          )}
        </div>
          );
        }}
      </AsyncView>
    </PageContainer>
  );
}


