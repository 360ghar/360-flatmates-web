import { Card } from "@/components/ui/Card";
import { NetworkImage } from "@/components/ui/NetworkImage";
import type { PropertyCreate } from "@/lib/api/types";
import { formatRent } from "@/lib/utils";
import type { PendingImage } from "./postListingUtils";

export function PostReviewStep({
  form,
  pendingImages
}: {
  form: Partial<PropertyCreate>;
  pendingImages: PendingImage[];
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3">Review & Publish</h2>
      <div className="flex flex-col gap-2 text-body-md text-ink-2">
        <p><span className="font-semibold text-ink">Title:</span> {form.title ?? "Not set"}</p>
        <p><span className="font-semibold text-ink">Rent:</span> {form.monthly_rent ? formatRent(form.monthly_rent) : "Not set"}</p>
        <p><span className="font-semibold text-ink">City:</span> {form.city ?? "Not set"}</p>
        <p><span className="font-semibold text-ink">Locality:</span> {form.locality ?? "Not set"}</p>
        <p><span className="font-semibold text-ink">Bedrooms:</span> {form.bedrooms ?? "Not set"}</p>
        <p><span className="font-semibold text-ink">Sharing Type:</span> {form.sharing_type ?? "Not set"}</p>
        <p><span className="font-semibold text-ink">Gender Preference:</span> {form.gender_preference ?? "Not set"}</p>
        <p><span className="font-semibold text-ink">Photos:</span> {pendingImages.length > 0 ? `${pendingImages.length} photo${pendingImages.length > 1 ? "s" : ""} selected` : "None"}</p>
        {(form.features?.length ?? 0) > 0 && (
          <p><span className="font-semibold text-ink">Features:</span> {form.features?.join(", ")}</p>
        )}
        {(form.society_amenities?.length ?? 0) > 0 && (
          <p><span className="font-semibold text-ink">Amenities:</span> {form.society_amenities?.join(", ")}</p>
        )}
      </div>
      {pendingImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pendingImages.map((img, index) => (
            <div key={img.id} className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-line">
              <NetworkImage
                alt={`Selected listing photo ${index + 1}`}
                src={img.preview}
                wrapperClassName="h-full w-full rounded-lg"
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
