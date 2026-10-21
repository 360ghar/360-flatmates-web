/**
 * localStorage key of the post-a-room wizard draft. The stored value is
 * `{ version, form, currentStep }`; a draft with another `version` is dropped
 * (see `features/hosting/pages/PostPage.tsx`).
 */
export const LISTING_DRAFT_STORAGE_KEY = "360-flatmates-listing-draft";

/** Bump when the shape of the draft `form` changes. */
export const LISTING_DRAFT_VERSION = 2;
