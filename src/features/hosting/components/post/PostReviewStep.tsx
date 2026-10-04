import { NetworkImage } from "@/components/ui/NetworkImage";
import type { PropertyCreate } from "@/lib/api/types";
import { formatRent, humanizeSnakeCase } from "@/lib/utils";
import type { PendingImage } from "@/features/hosting/lib/postListingUtils";

export function PostReviewStep({
  form,
  pendingImages
}: {
  form: Partial<PropertyCreate>;
  pendingImages: PendingImage[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-h2 text-ink">Review & publish</h2>
      <div className="flex flex-col gap-2 text-body-md text-ink-2">
        <p><span className="font-semibold text-ink">Title:</span> {form.title ?? "Not set"}</p>
        <p><span className="font-semibold text-ink">Rent:</span> {form.monthly_rent ? formatRent(form.monthly_rent) : "Not set"}</p>
        <p><span className="font-semibold text-ink">City:</span> {form.city ?? "Not set"}</p>
        <p><span className="font-semibold text-ink">Locality:</span> {form.locality ?? "Not set"}</p>
        <p><span className="font-semibold text-ink">Bedrooms:</span> {form.bedrooms ?? "Not set"}</p>
        <p><span className="font-semibold text-ink">Sharing Type:</span> {form.sharing_type ? humanizeSnakeCase(form.sharing_type) : "Not set"}</p>
        <p><span className="font-semibold text-ink">Furnishing:</span> {form.furnishing_level ? humanizeSnakeCase(form.furnishing_level) : "Not set"}</p>
        <p><span className="font-semibold text-ink">Kitchen Type:</span> {form.kitchen_type ? humanizeSnakeCase(form.kitchen_type) : "Not set"}</p>
        <p><span className="font-semibold text-ink">Ventilation:</span> {form.ventilation_type ? humanizeSnakeCase(form.ventilation_type) : "Not set"}</p>
        {form.windows_count !== undefined && (
          <p><span className="font-semibold text-ink">Windows:</span> {form.windows_count}</p>
        )}
        {form.ventilation_shafts !== undefined && (
          <p><span className="font-semibold text-ink">Ventilation Shafts:</span> {form.ventilation_shafts}</p>
        )}
        {form.floor_number !== undefined && (
          <p><span className="font-semibold text-ink">Floor:</span> {form.floor_number}{form.total_floors !== undefined ? ` of ${form.total_floors}` : ""}</p>
        )}
        <p><span className="font-semibold text-ink">Gender Preference:</span> {form.gender_preference ? humanizeSnakeCase(form.gender_preference) : "Not set"}</p>
        {form.setup_cost !== undefined && (
          <p><span className="font-semibold text-ink">Setup Cost:</span> {formatRent(form.setup_cost)}</p>
        )}
        {form.other_charges !== undefined && (
          <p><span className="font-semibold text-ink">Other Charges:</span> {formatRent(form.other_charges)}{form.other_charges_description ? ` (${form.other_charges_description})` : ""}</p>
        )}
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
            <div key={img.id} className="h-16 w-20 shrink-0 overflow-hidden rounded-cut-md">
              <NetworkImage
                alt={`Selected listing photo ${index + 1}`}
                src={img.preview}
                wrapperClassName="h-full w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
