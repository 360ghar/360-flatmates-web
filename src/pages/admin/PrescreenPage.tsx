import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  CheckCircle2,
  Flag,
  XCircle
} from "lucide-react";
import { useAdminProperty, useAdminModerate } from "@/hooks/queries";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PageLayout, PageHeader } from "@/components/ui/Layout";
import { PriceText } from "@/components/ui/PriceText";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, ErrorState } from "@/components/ui/StateViews";
import { uiStore } from "@/lib/stores/ui-store";
import { humanizeSnakeCase, formatSharingType } from "@/lib/utils";
import type { StatusTone } from "@/components/ui/Badge";

const PROPERTY_MOD_STATUS_BADGE: Record<string, StatusTone> = {
  approved: "confirmed",
  rejected: "rejected",
};

export function PrescreenPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listingId = id !== undefined ? Number(id) : Number.NaN;

  // If `:id` is missing or not a positive integer, the property query is
  // meaningless and would spin forever. Bounce back to the listing queue
  // immediately with a toast explaining what happened.
  const idIsValid = Number.isInteger(listingId) && listingId > 0;
  useEffect(() => {
    if (idIsValid) return;
    uiStore.getState().pushToast({
      type: "error",
      title: "Invalid listing",
      description: "That listing could not be opened for pre-screening."
    });
    navigate("/admin/moderation/listings", { replace: true });
  }, [idIsValid, navigate]);

  const { data, isLoading, error, refetch } = useAdminProperty(
    idIsValid ? listingId : 0
  );
  const moderate = useAdminModerate();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  if (!idIsValid) {
    // Render a minimal placeholder while the redirect effect fires.
    return null;
  }

  function handleApprove() {
    if (moderate.isPending) return;
    moderate.mutate(
      { listingId, payload: { action: "approve" } },
      {
        onSuccess: () => {
          uiStore.getState().pushToast({
            type: "success",
            title: "Listing approved",
            description: "The listing is now live."
          });
          navigate("/admin/moderation/listings");
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not approve listing",
            description: "Please try again."
          });
        }
      }
    );
  }

  function handleReject() {
    if (!rejectReason.trim() || moderate.isPending) return;
    moderate.mutate(
      {
        listingId,
        payload: { action: "reject", reason: rejectReason.trim() }
      },
      {
        onSuccess: () => {
          setRejectModalOpen(false);
          setRejectReason("");
          uiStore.getState().pushToast({
            type: "success",
            title: "Listing rejected",
            description: "The owner will see your reason."
          });
          navigate("/admin/moderation/listings");
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not reject listing",
            description: "Please try again."
          });
        }
      }
    );
  }

  return (
    <PageLayout>
      <PageHeader
        eyebrow="Moderation"
        title="Listing Review"
        onBack={() => navigate("/admin/moderation/listings")}
      />

      <div className="mt-6">
        <AsyncView
          data={data}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          loading={
            <div className="flex flex-col gap-6">
              {/* Image grid skeleton */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="aspect-[16/10] rounded-2xl" />
                ))}
              </div>
              {/* Title/Price card skeleton */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <Skeleton className="h-7 w-3/5" />
                <Skeleton className="mt-2 h-4 w-2/5" />
                <Skeleton className="mt-3 h-8 w-1/4" />
                <Skeleton className="mt-3 h-5 w-20 rounded-full" />
              </div>
              {/* Description card skeleton */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-4/5" />
              </div>
              {/* Property details grid skeleton */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <Skeleton className="h-3 w-28" />
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Features card skeleton */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <Skeleton className="h-3 w-16" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-6 w-20 rounded-full" />
                  ))}
                </div>
              </div>
              {/* Owner card skeleton */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <Skeleton className="h-3 w-14" />
                <div className="mt-3 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
              {/* Action bar skeleton */}
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-10 flex-1 rounded-[8px]" />
                <Skeleton className="h-10 flex-1 rounded-[8px]" />
              </div>
            </div>
          }
          errorView={
            <Card className="flex items-center justify-center p-6">
              <ErrorState
                title="Could not load listing"
                description="The listing may have been removed or you may not have access."
                onRetry={() => refetch()}
              />
            </Card>
          }
        >
          {(property) => (
            <div className="flex flex-col gap-6">
              {/* Images */}
              {property.image_urls && property.image_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {property.image_urls.map((url, index) => (
                    <NetworkImage
                      key={url}
                      src={url}
                      alt={`${property.title} - image ${index + 1}`}
                      wrapperClassName="aspect-[16/10] rounded-2xl"
                    />
                  ))}
                </div>
              )}
              {property.main_image_url && (!property.image_urls || property.image_urls.length === 0) && (
                <NetworkImage
                  src={property.main_image_url}
                  alt={property.title}
                  wrapperClassName="aspect-[16/10] max-h-80 rounded-2xl"
                />
              )}

              {/* Title & Price */}
              <Card as="section" variant="compact">
                <h2 className="text-h2 text-ink">{property.title}</h2>
                <p className="mt-1 text-body-md text-ink-2">
                  {property.locality}, {property.city}
                  {property.state ? `, ${property.state}` : ""}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <PriceText value={property.monthly_rent} variant="hero" />
                  {property.security_deposit && (
                    <span className="text-body-md text-ink-3">
                      Deposit: <PriceText value={property.security_deposit} variant="inline" suffix="" />
                    </span>
                  )}
                </div>
                {property.sharing_type && (
                  <Badge className="mt-3" tone="teal">
                    {formatSharingType(property.sharing_type)}
                  </Badge>
                )}
              </Card>

              {/* Description */}
              {property.description && (
                <Card as="section" variant="compact">
                  <h3 className="text-eyebrow text-ink-3">Description</h3>
                  <p className="mt-2 whitespace-pre-wrap text-body-md text-ink-2">
                    {property.description}
                  </p>
                </Card>
              )}

              {/* Property Details */}
              <Card as="section" variant="compact">
                <h3 className="text-eyebrow text-ink-3">Property Details</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {property.property_type && (
                    <DetailItem label="Type" value={humanizeSnakeCase(property.property_type)} />
                  )}
                  {property.purpose && (
                    <DetailItem label="Purpose" value={humanizeSnakeCase(property.purpose)} />
                  )}
                  {property.bedrooms && (
                    <DetailItem label="Bedrooms" value={String(property.bedrooms)} />
                  )}
                  {property.bathrooms && (
                    <DetailItem label="Bathrooms" value={String(property.bathrooms)} />
                  )}
                  {property.area_sqft && (
                    <DetailItem label="Area" value={`${property.area_sqft} sq ft`} />
                  )}
                  {property.available_from && (
                    <DetailItem
                      label="Available from"
                      value={new Date(property.available_from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    />
                  )}
                  {property.gender_preference && (
                    <DetailItem
                      label="Gender preference"
                      value={humanizeSnakeCase(property.gender_preference)}
                    />
                  )}
                </div>
              </Card>

              {/* Features & Amenities */}
              {property.features && property.features.length > 0 && (
                <Card as="section" variant="compact">
                  <h3 className="text-eyebrow text-ink-3">Features</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {property.features.map((feature) => (
                      <Badge key={feature} tone="neutral">
                        {humanizeSnakeCase(feature)}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Owner Info */}
              {property.owner && (
                <Card as="section" variant="compact">
                  <h3 className="text-eyebrow text-ink-3">Owner</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar
                      name={property.owner.full_name}
                      src={property.owner.profile_image_url}
                      size="sm"
                      shape="circle"
                    />
                    <div>
                      <p className="text-body-lg font-semibold text-ink">
                        {property.owner.full_name}
                      </p>
                      {property.owner.phone && (
                        <p className="text-caption text-ink-3">{property.owner.phone}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Moderation Status */}
              {property.property_status && (
                <Card as="section" variant="compact">
                  <h3 className="text-eyebrow text-ink-3">Moderation Status</h3>
                  <div className="mt-3">
                    <Badge
                      variant="status"
                      status={PROPERTY_MOD_STATUS_BADGE[property.property_status ?? ""] ?? "pending"}
                    />
                  </div>
                </Card>
              )}

              {/* AI Pre-Screen Flags */}
              {property.tags && property.tags.length > 0 && (
                <Card as="section" variant="compact">
                  <h3 className="text-eyebrow text-ink-3">AI Flags</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {property.tags.map((tag) => (
                      <Badge
                        key={tag}
                        tone="warning"
                        icon={<Flag aria-hidden="true" className="h-3 w-3" />}
                      >
                        {humanizeSnakeCase(tag)}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* TODO: Audit trail — surface the listing's moderation history
                  (who took which action and when) once the backend exposes an
                  audit-log endpoint. A "History" tab can be added to this
                  detail page that lists each row chronologically. */}
            </div>
          )}
        </AsyncView>
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-0 z-[var(--z-sticky)] -mx-5 mt-6 border-t border-line bg-paper/88 px-5 py-3 backdrop-blur-[9px] md:-mx-6 md:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3">
          <Button
            size="compact"
            variant="secondary"
            leadingIcon={<XCircle aria-hidden="true" className="h-4 w-4" />}
            onClick={() => setRejectModalOpen(true)}
            disabled={moderate.isPending}
          >
            Reject
          </Button>
          <Button
            size="compact"
            variant="primary"
            leadingIcon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
            onClick={() => setApproveModalOpen(true)}
            disabled={moderate.isPending}
          >
            Approve
          </Button>
        </div>
      </div>

      {/* Approve confirmation */}
      <Modal
        open={approveModalOpen}
        title="Approve Listing"
        description="This listing will become visible to all users."
        onClose={() => {
          if (moderate.isPending) return;
          setApproveModalOpen(false);
        }}
        footer={
          <>
            <Button
              size="compact"
              variant="secondary"
              onClick={() => setApproveModalOpen(false)}
              disabled={moderate.isPending}
            >
              Cancel
            </Button>
            <Button
              size="compact"
              variant="primary"
              loading={moderate.isPending}
              onClick={() => {
                setApproveModalOpen(false);
                handleApprove();
              }}
            >
              Confirm Approval
            </Button>
          </>
        }
      >
        <p className="text-body-md text-ink-2">
          The owner will be notified that their listing is live.
        </p>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        open={rejectModalOpen}
        title="Reject Listing"
        description="Please provide a reason for rejecting this listing."
        onClose={() => {
          if (moderate.isPending) return;
          setRejectModalOpen(false);
        }}
        footer={
          <>
            <Button
              size="compact"
              variant="secondary"
              onClick={() => setRejectModalOpen(false)}
              disabled={moderate.isPending}
            >
              Cancel
            </Button>
            <Button
              size="compact"
              variant="primary"
              loading={moderate.isPending}
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <TextArea
          label="Reason"
          placeholder="Describe why this listing is being rejected..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
        />
      </Modal>
    </PageLayout>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption text-ink-3">{label}</span>
      <span className="text-body-md font-semibold text-ink capitalize">{value}</span>
    </div>
  );
}
