# Listing management

Active contributors: Saksham

A room poster's journey on 360 Flatmates is post, review, manage, edit. The poster walks an eight-step wizard to publish a room. The listing waits for a moderator. After approval the poster manages it from a grid of cards. This page covers the post flow, the review gate, the manage list, the detail view with pause, resume and delete, the edit form, and the listing states. For how the room poster mode is selected during onboarding, see [Profile and onboarding](profile-onboarding.md). For the numbers that follow a published listing, see [Dashboard and analytics](dashboard-analytics.md). For the visits booked against a listing, see [Visits](visits.md). For the property data model, see [Listing and property model](../primitives/listing-property.md).

## The room poster surface

| Route | File | Purpose |
| --- | --- | --- |
| `/post` | `src/features/hosting/pages/PostPage.tsx` | Eight-step post wizard |
| `/post/review/:listingId` | `src/features/hosting/pages/PostReviewPage.tsx` | "Under review" confirmation screen |
| `/manage` | `src/features/hosting/pages/ManagePage.tsx` | Grid of the user's own listings |
| `/my-listings/:id` | `src/features/hosting/pages/MyListingDetailPage.tsx` | Single listing detail with pause, resume, edit, delete |
| `/my-listings/:id/edit` | `src/features/hosting/pages/MyListingEditPage.tsx` | Edit form (react-hook-form and Zod) |

## The post wizard

`PostPage` wraps a shared `ListingBuilder` (`src/features/hosting/components/ListingBuilder.tsx`) around eight steps.

| Step | id | Required fields |
| --- | --- | --- |
| 1 | `basics` | `title` (5 characters or more), `monthly_rent` (500 or more) |
| 2 | `location` | `city`, `locality` |
| 3 | `property_details` | none |
| 4 | `room_details` | none |
| 5 | `amenities` | none |
| 6 | `photos` | none |
| 7 | `preferences` | none |
| 8 | `review` | steps 1 and 2 |

The backend takes photos as hosted URLs only. Each photo is uploaded when it is picked: `useListingPhotoUpload` (`src/features/hosting/hooks/useListingPhotoUpload.ts`) converts it to WebP and sends it to `POST /upload` with `folder_type=property_image`. The form keeps the returned `public_url` in `image_urls`, so the draft holds hosted URLs only. Publish waits until every upload is done. The backend makes the first URL the main photo. The listing edit page adds photos the same way and sends the new `image_urls` list.

`toPropertyCreate` (`src/features/hosting/lib/listing-payload.ts`) builds the `POST /properties` body. It sends `base_price` equal to `monthly_rent` for a rent listing, sends the address as `full_address`, and sends only the keys that `PropertyCreate` declares. Any other key is a 422.

### Draft persistence

The wizard saves the form to `localStorage` under `360-flatmates-listing-draft` with a `version` (`LISTING_DRAFT_VERSION`). A draft saved under another version is dropped. A successful publish clears the draft, and so does sign-out.

## The review gate

After publish, `PostPage` goes to `/post/review/:listingId`. The page shows a three-step tracker and a note that every listing is checked within 24 hours. The listing is in `pending_review` and is hidden from seekers until a moderator approves it. See [Admin moderation](admin-moderation.md).

## The manage list

`ManagePage` reads every listing of the owner with `useMyProperties()` (`GET /properties/me`, 100 rows a page, following `next_cursor`) and renders each one through `ListingCard`. The page uses `AsyncView` for the loading, error and empty states.

## Listing detail and actions

`MyListingDetailPage` reads one listing with `useMyProperty(id)` and shows the listing card, the status, and three actions:

| Action | Hook | Request | Effect |
| --- | --- | --- | --- |
| Pause or resume | `useSetListingStatus(id)` | `PUT /properties/{id}` with `{ listing_preferences: { moderation_status: "paused" \| "live" } }` | Hides a live listing from search, or shows a paused one again |
| Edit | none | route to `/my-listings/{id}/edit` | Opens the edit form |
| Delete | `useDeleteProperty(id)` | `DELETE /properties/{id}` (204) | Removes the listing and goes back to `/manage` |

The server accepts `paused` only from `live` or `paused`, and `live` only from `paused`. Any other change is a 409 `LISTING_STATUS_CONFLICT`, and the page shows the message.

### Listing states

The owner state of a listing is `listing_preferences.moderation_status`: `pending_review`, `live`, `paused` or `rejected`. `ownerListingStatus` (`src/lib/api/property-fields.ts`) reads it. A listing with no stored value counts as `pending_review`, the same as the moderation queue. `Property.status` is a different field (`available`, `sold`, `rented`, `under_offer`, `maintenance`) and the web does not use it for the owner state.

## The edit form

`MyListingEditPage` is a react-hook-form form. On save, `toPropertyUpdate` builds a `PUT /properties/{id}` body with PATCH rules:

- Only the fields the owner changed are sent.
- A field the owner emptied is sent as `null`, except `title` and `monthly_rent`, which are never cleared.
- `base_price` follows `monthly_rent`.
- The form has no `is_available`, so a content edit never sends it. Availability is the pause and resume action.

A content edit sends a live listing back to `pending_review`. The page tells the owner before the save, and it reads the server state from the response instead of merging the form values.

`ListingPhotoManager` adds photos, removes one or several, and chooses the main photo. A new photo uploads first through `POST /upload` (three at a time); the new list then goes back as `image_urls`, and the server reads the order as the display order. Remove, reorder and delete are locked while an upload is in flight. Removing a photo does not delete its media-library file: the listing carries URLs, and `POST /upload/media/batch-delete` takes media IDs.

## Mutations and cache invalidation

All listing hooks are in `src/features/listings/hooks/useProperties.ts`.

| Hook | Invalidates |
| --- | --- |
| `useCreateProperty` | `properties/mine` |
| `useUpdateProperty(id)` | `properties/{id}`, `properties/{id}/mine`, `properties/mine` |
| `useSetListingStatus(id)` | same as `useUpdateProperty` |
| `useDeleteProperty(id)` | `properties/mine`, and removes `properties/{id}` |

The owner dashboard is derived from `properties/mine`, so it needs no key of its own.

## Cross-references

- [Profile and onboarding](profile-onboarding.md) for room poster mode selection.
- [Dashboard and analytics](dashboard-analytics.md) for the numbers that follow a published listing.
- [Visits](visits.md) for the visit flow against a listing.
- [Admin moderation](admin-moderation.md) for the queue that handles `pending_review` listings.
- [Listing and property model](../primitives/listing-property.md) for the data model.

## Key source files

| File | Purpose |
| --- | --- |
| `src/features/hosting/pages/PostPage.tsx` | Eight-step post wizard, draft persistence, publish |
| `src/features/hosting/pages/PostReviewPage.tsx` | "Under review" confirmation screen |
| `src/features/hosting/pages/ManagePage.tsx` | Grid of the user's own listings |
| `src/features/hosting/pages/MyListingDetailPage.tsx` | Listing detail, pause, resume, delete |
| `src/features/hosting/pages/MyListingEditPage.tsx` | Edit form |
| `src/features/hosting/lib/listing-payload.ts` | `toPropertyCreate` and `toPropertyUpdate` |
| `src/features/hosting/components/ListingPhotoManager.tsx` | Photo upload, removal and main photo |
| `src/features/listings/hooks/useProperties.ts` | Listing query and mutation hooks |
| `src/lib/api/property-fields.ts` | `readListingPreferences`, `ownerListingStatus`, `propertyImageUrls` |
| `src/lib/api/property.types.ts` | `Property`, `PropertyCreate`, `PropertyUpdate` aliases |
