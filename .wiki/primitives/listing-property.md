# Listing and property

Active contributors: Saksham

A listing is a room or flat posted by a room poster. In the codebase the term "property" and "listing" are used interchangeably: the canonical type is `Property` in `src/lib/api/property.types.ts`, validated by `propertySchema` in `src/lib/schemas/listing-builder.ts`, and its enum values live in `src/lib/data/domain.ts`. A listing shows up on the discover surface, in the swipe deck, on the map, in the dashboard, in a visit, and in a conversation as context. It is the second-most-cross-referenced object after the flatmate profile.

## Property type and purpose

Every listing has a `property_type` (defined by `PROPERTY_TYPE_VALUES`) and a `purpose` (defined by `PROPERTY_PURPOSE_VALUES`):

| Field | Allowed values | Notes |
| --- | --- | --- |
| `property_type` | `pg`, `flatmate` | PG is a managed co-living room; flatmate is a room in a shared flat |
| `purpose` | `rent` | Only rent is modeled today |

## Sharing type and society

A listing's room is described by `sharing_type` (defined by `LISTING_SHARING_TYPE_VALUES`): `private_room`, `shared_room`, `master_bedroom`, or `entire_flat`. The building is described by `society_type` (defined by `SOCIETY_TYPE_VALUES`): `gated`, `independent`, `co_living`, or `pg`. Society-level metadata (`society_amenities`, `society_vibe_tags`) is separate from the room-level `features` so a building can be tagged once and reused across rooms.

## Lifecycle and moderation

A listing carries two status fields, kept separate because they answer different questions:

| Field | Type | Answers |
| --- | --- | --- |
| `status` | `PropertyStatus` (`available`, `sold`, `rented`, `under_offer`, `maintenance`) | The sales state of the property. The web does not use it for the owner state. |
| `listing_preferences.moderation_status` | `ListingModerationStatus` (`pending_review`, `live`, `paused`, `rejected`) | The owner state of a flatmate or PG listing: moderation and the owner's pause. |

Only a `live` listing is discoverable. The owner pauses and resumes it; a moderator approves or rejects it (see [admin moderation](../features/admin-moderation.md)). `listing_preferences.expires_at` is the expiry date.

## Shape

```mermaid
erDiagram
    Property {
        number id PK
        PropertyType property_type
        PropertyPurpose purpose
        string title
        number monthly_rent
        string city
        string locality
        ListingSharingType sharing_type
        PropertyStatus status
        number owner_id
        string owner_name
        ListingPreferences listing_preferences
        PropertyImage images
    }
```

The full `Property` type also carries engagement counters (`interest_count`, `view_count`, `like_count`), the viewer's relationship to it (`liked`, `user_has_scheduled_visit`, `user_next_visit_date`), optional geo (`latitude`, `longitude`, `distance_km`), and the owner as `owner_id`, `owner_name` and `owner_contact` (for a viewer who is not the owner, `owner_contact` is the agent or company number). The create payload, `PropertyCreate`, is a strict subset (no counters, no status fields, no owner) and is validated by `propertyCreateSchema`, which refines the payload so `security_deposit` cannot exceed twelve months of rent.

## Owner state and photos

The owner state of a listing is `listing_preferences.moderation_status` (`pending_review`, `live`, `paused`, `rejected`). The owner pauses and resumes a listing with `useSetListingStatus` (`PUT /properties/{id}`). A content edit sends a live listing back to `pending_review`. Photos are `Property.images[].image_url`, in display order. The owner adds photos (uploaded first with `POST /upload`), removes photos or picks the main one by sending the new `image_urls` list. The web has no boost or renew: no backend route exists for them.

## Builder schema

The listing builder (`src/lib/schemas/listing-builder.ts`) splits the create flow into six step schemas that map onto the builder UI: `listingLocationStepSchema`, `listingSocietyStepSchema`, `listingRoomStepSchema`, `listingFlatStepSchema`, `listingCostsStepSchema`, and `listingAboutStepSchema`. Each is partializable so the draft can be saved at any step. The assembled draft (`listingDraftSchema`) is persisted to `localStorage` under a storage key so a user can leave and resume. See [listing management](../features/listing-management.md) for the step flow.

## Related pages

- [Listing management](../features/listing-management.md) for the builder, draft persistence, and CRUD.
- [Discover](../features/discover.md) for how seekers browse active listings.
- [Dashboard analytics](../features/dashboard-analytics.md) for the room-poster dashboard and per-listing stats.
- [Visits](../features/visits.md) for how a visit attaches to a listing.

## Key source files

| File | Role |
| --- | --- |
| `src/lib/api/property.types.ts` | `Property`, `PropertyCreate`, `PropertyUpdate`, generated-schema aliases and UI summary types |
| `src/lib/schemas/listing-builder.ts` | `propertyCreateSchema`, `propertySchema`, per-step builder schemas, `listingDraftSchema` |
| `src/lib/data/domain.ts` | `PropertyType`, `PropertyPurpose`, `ListingSharingType`, `SocietyType`, `PropertyStatus`, `ListingModerationStatus` |
| `src/features/listings/hooks/useProperties.ts` | `useMyProperties`, `useCreateProperty`, `useUpdateProperty`, `useSetListingStatus`, `useDeleteProperty` |
