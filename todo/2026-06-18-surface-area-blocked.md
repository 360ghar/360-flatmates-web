# Surface-Area Blocked Items — Backend Follow-ups

- **Date:** 2026-06-18
- **Source:** ADR-001 §3 (B-1..B-6)
- **Decision:** All 6 items are blocked until the backend defines the wire contract. No client work is started.

The web app audit found 6 places where the backend has not defined the wire, but the feature is implied or partially implemented. Each item below has the client-side state today and the backend questions to answer.

---

## B-1: `useBlockUser` mutation is inlined, not in `useBlocks.ts`

**Client state today:**
- `src/hooks/queries/useBlocks.ts:1-37` exports only `useBlockedUsers` and `useUnblockUser`.
- `src/pages/app/ChatDetailPage.tsx:38-51` inlines a `useMutation` for `POST /flatmates/blocks` with body `{ blocked_user_id }`.
- The path `/flatmates/blocks` is hard-coded; the invalidation keys are hard-coded; the response shape is unchecked.
- A future "block from public profile" or "block from listing detail" surface will re-derive the same path/body.

**Backend questions:**
- Is `POST /flatmates/blocks` the canonical endpoint? (`docs/flatmates-openapi.yaml` does not list it.)
- Is the request body `{ blocked_user_id: number }` correct, or is there a `reason` field?
- What is the response shape — full user object, or just an acknowledgement?
- On `409` (already blocked), what is the `appError.type`?
- Should blocking invalidate `["matches"]` and `["conversations"]` on the client, or is that a server-pushed SSE event?
- Is there a separate endpoint for bulk-blocking (block-by-phone-number, block-by-email)?

**Once answered:** Move the inlined mutation from `ChatDetailPage.tsx:38-51` into `useBlocks.ts` as `useBlockUser`. Reuse from the chat thread, public profile, and any future surface.

---

## B-2: Attachment upload is undefined

**Client state today:**
- `src/lib/api/conversation.types.ts:46-51` defines `MessageCreate.attachment_url?: string` and `message_type?: "text" | "image" | "..."`.
- `src/hooks/queries/useConversations.ts:91-96` sends `payload.body` only.
- `src/components/organisms/ChatThread.tsx:373-375` renders a Paperclip button with no `onClick`.
- `src/components/molecules/ChatMessageBubble.tsx` only renders `message.text`.

**Backend questions:**
- Is there a file-upload endpoint (multipart)? If yes: path, size limits, allowed MIME types, response shape (the CDN URL?).
- Is there a presigned-URL flow (client uploads to S3 directly)? If yes: what's the signing endpoint, what are the headers, what are the CORS rules?
- Is the attachment allowed to be a non-image (PDF, voice, document)? What's the `message_type` enum?
- Should attachments go through the same content-moderation pipeline as listing photos?
- Is the maximum file size aligned with the listing photo limit (currently ~10MB before WebP conversion)?

**Once answered:** Build the file picker + drag-drop + paste handler in `ChatThread.tsx`. Render the image/file in `ChatMessageBubble.tsx`. Wire the optimistic send.

---

## B-3: Typing indicators and read receipts — wire is undefined

**Client state today:**
- `src/lib/stores/chat-store.ts:42-46` defines `setTyping(conversationId, typing)`.
- `src/lib/sse/types.ts:6-18` does NOT include `typing` or `message_read` event types.
- `src/components/organisms/ChatThread.tsx` never reads `isTyping`, never renders a typing bubble, never debounces a `setTyping` call.
- `src/components/molecules/ChatMessageBubble.tsx:58-60` renders `CheckCheck` only for `status === "read"`. No `Check` for `sent`, no spinner for `sending`, no separate `delivered` icon.

**Backend questions:**
- Is there a `typing` SSE event? Payload: `{ conversation_id, user_id, is_typing: bool }`?
- Is there a `POST /conversations/{id}/typing` endpoint to start/stop, or is typing implicit on send/receive?
- What is the read-receipt event? `message_read` with `{ message_id, read_by_user_id, read_at }`?
- What is the `delivered` signal? Is it implicit on receive, or is there a `message_delivered` event?
- Is the typing indicator persisted (visible to users who join later) or real-time only?

**Once answered:** Add the SSE event types in `src/lib/sse/types.ts`. Render a `<TypingBubble />` in `ChatThread.tsx`. Add the per-message status icons in `ChatMessageBubble.tsx`. Send a debounced `typing` POST on keypress in the composer.

---

## B-4: Bulk actions on admin moderation queues

**Client state today:**
- `src/pages/admin/ModerationListingsPage.tsx` and `ModerationReportsPage.tsx` have no checkboxes, no select-all, no bottom action bar.
- `src/components/molecules/SelectableCardGrid.tsx` exists in the design system but is unused.
- Every action is one-at-a-time.

**Backend questions:**
- Is there a bulk-action endpoint, e.g. `POST /flatmates/admin/listings/bulk` with `{ ids, action }`?
- Is bulk-dismiss of obvious-spam the highest-value use case (skip per-item review for low-confidence reports)?
- Are bulk actions atomic (all-or-nothing) or partial-success with per-id results?
- Is there a rate limit on bulk actions?
- Should the audit log show "bulk action by admin X" as one entry or N entries?

**Once answered:** Add `<SelectableCardGrid>` wrapper to the listing/report rows. Add a sticky bottom action bar. Call the bulk endpoint. Show a per-id success/failure toast.

---

## B-5: Take-down of an approved listing

**Client state today:**
- `src/pages/app/MyListingEditPage.tsx:414-422` toggles `is_available` to "pause" — but the OpenAPI listing model has a separate `lifecycle: "paused"` enum.
- There is no UI for a moderator to take down an `approved` listing.
- The moderation actions available today are: `dismiss`, `warn`, `suspend` (per `REPORT_ACTION_VALUES` in the client) — no `remove_listing` or `unpublish_listing`.

**Backend questions:**
- Is the action `reject` (toggling `moderation: approved → rejected`) the right way to take down a live listing?
- Or is there a separate `unpublish` action that toggles `lifecycle: active → paused` while keeping the moderation record?
- Should the owner be notified, and via what channel (in-app + email + SMS)?
- Does the listing remain visible to the owner (and only the owner) while taken down?
- Is there a grace period (e.g. 24h) before hard-deleting a taken-down listing?
- Can the owner appeal, and what's the appeal flow?

**Once answered:** Add a "Take down" button to `ModerationListingsPage.tsx:286-315` and `PrescreenPage.tsx:330-351`. Wire to the appropriate action. Show a confirmation modal that captures the reason.

---

## B-6: Request-edit moderation action — wire is defined but UI is missing

**Client state today:**
- `src/lib/data/domain.ts:396` includes `"request_edit"` in `MODERATION_ACTION_VALUES`.
- `docs/flatmates-openapi.yaml:3724-3726` documents the action.
- The UI in `ModerationListingsPage.tsx:286-315` only shows Approve and Reject.
- `src/hooks/queries/useAdmin.ts:30-70` (`useAdminModerate`) can carry any action, but no consumer sends `request_edit`.

**Backend questions:**
- Is the request body the same shape as the other actions (`{ reason, notes }`)?
- Does the action create a notification to the owner? Through what channel?
- Does it create a "to-do" item for the owner, or just an in-app notification?
- Can the owner resubmit after editing, and is that a new moderation cycle or an in-place update?
- Is there a deadline (e.g. 7 days to edit before auto-rejection)?

**Once answered:** Add a "Request Edit" button between Approve and Reject in `ModerationListingsPage.tsx:286-315` and `PrescreenPage.tsx:330-351`. Build a `RequestEditModal` that captures the change-request message. Wire to `useAdminModerate({ action: "request_edit", ... })`.
