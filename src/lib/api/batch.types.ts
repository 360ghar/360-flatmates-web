/** Response envelope for `POST /swipes/batch-remove`. */
export interface BatchRemoveSwipesResponse {
  /** Number of swipes successfully removed. */
  removed_count: number;
  /** Property ids that could not be removed (e.g. because they no longer exist). */
  failed_property_ids?: number[];
  message: string;
}

/** Request body for `POST /swipes/batch-remove`. */
export interface BatchRemoveSwipesRequest {
  property_ids: number[];
}

/** Response envelope for `POST /upload/media/batch-delete`. */
export interface BatchDeleteMediaResponse {
  /** Cloudinary public ids / media ids that were deleted. */
  deleted: string[];
  /** Media ids that failed to delete (with reason). */
  failed: Array<{ id: string; reason: string }>;
}

/** Request body for `POST /upload/media/batch-delete`. */
export interface BatchDeleteMediaRequest {
  media_ids: string[];
}
