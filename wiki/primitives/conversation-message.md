# Conversation and message

Active contributors: Saksham

A conversation is a chat thread between two flatmates, and a message is a single line in that thread. The canonical types live in `src/lib/api/conversation.types.ts` (re-exported from `src/lib/api/types.ts`), and the TanStack Query hooks that fetch and mutate them live in `src/hooks/queries/useConversations.ts`. A conversation crosses the messaging surface, the real-time SSE surface (which delivers new messages), the visits surface (which links a flatmate-meet visit to its thread), and the compatibility surface (which ranks who you might want to start a conversation with).

## Conversation

A `ConversationSummary` is the row shown in the inbox. It carries the peer (a `FlatmatesPeer`, see [flatmate profile](flatmate-profile.md)), the optional property context that sparked the chat, preview and unread state, and a QnA state:

```ts
interface ConversationSummary {
  id: number;
  source: ConversationSource;       // "listing_interest" | "profile_match"
  status: ConversationStatus;        // "active" | "archived" | "blocked" | "closed"
  peer: FlatmatesPeer;
  context_property?: ConversationPropertyContext;
  last_message_preview?: string;
  last_message_at?: string;
  unread_count?: number;
  matched_at?: string;
  qna?: ConversationQnAState;
}
```

### Source and status

`ConversationSource` (defined by `CONVERSATION_SOURCE_VALUES`) is either `listing_interest` (the chat started from a listing) or `profile_match` (the chat started from a mutual like). `ConversationStatus` (defined by `CONVERSATION_STATUS_VALUES`) is `active`, `archived`, `blocked`, or `closed`.

### QnA state

A conversation can carry an optional QnA exchange (`ConversationQnAState`) where each side has answered up to three short questions (`q1`, `q2`, `q3`). The state tracks whether the current user and the peer have answered and whether both have, so the UI can prompt the right person.

### Property context

When a chat started from a listing, `context_property` (`ConversationPropertyContext`) carries the listing id, title, locality, city, rent, main image, and owner name and image. This is what the chat header renders and what the schedule-visit flow reads to anchor a visit.

## Message

A `MessageOut` is a single message:

```ts
interface MessageOut {
  id: number;
  conversation_id: number;
  sender_id: number;
  body?: string;
  attachment_url?: string;
  message_type: MessageType;        // "text" | "image" | "system" | "visit_request"
  metadata?: JsonObject;
  read_at?: string;
  created_at?: string;
}
```

`MessageType` (defined by `MESSAGE_TYPE_VALUES`) is `text`, `image`, `system`, or `visit_request`. The `visit_request` type lets the chat thread render an inline visit-request card instead of a plain text bubble.

## Optimistic send

`useSendMessage` in `src/hooks/queries/useConversations.ts` is the most carefully engineered hook in the messaging layer. It uses TanStack Query's optimistic-update pattern with a few deliberate twists:

- A negative temp id is minted for the optimistic message so it never collides with a real backend id (which are positive integers).
- On error, the optimistic bubble is intentionally kept in cache and tagged as failed, so the user's text does not vanish on a network error. The user can retry from the failed bubble.
- On success, the optimistic temp message is swapped in-place for the authoritative server message before invalidation, so the SSE echo that follows finds the real id already present and the user's own message never double-renders.
- `onSettled` does not invalidate on error (which would refetch and wipe the failed bubble), only on success.

## Pagination

`useMessages(conversationId, page?)` fetches a page of messages and returns a `MessageListResponse` with `messages`, `total`, and a `has_more` flag for infinite-scroll decisions.

## Related pages

- [Messaging](../features/messaging.md) for the inbox, chat thread, QnA, and the schedule-visit-from-chat flow.
- [Real-time updates](../features/real-time.md) for how SSE delivers new messages and conversation updates.
- [Flatmate profile](flatmate-profile.md) for the peer shape embedded in a conversation.

## Key source files

| File | Role |
| --- | --- |
| `src/lib/api/conversation.types.ts` | `ConversationSummary`, `ConversationPropertyContext`, `ConversationQnAState`, `MessageOut`, `MessageCreate`, `MessageListResponse`, `ConversationCreate` |
| `src/lib/api/types.ts` | Re-exports all conversation and message types |
| `src/lib/data/domain.ts` | `ConversationSource`, `ConversationStatus`, `MessageType` |
| `src/hooks/queries/useConversations.ts` | `useConversations`, `useConversation`, `useMessages`, `useSendMessage` (with optimistic send), `useCreateConversation` |
