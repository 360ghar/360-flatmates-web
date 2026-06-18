# Primitives

Primitives are the foundational domain objects that show up across three or more systems in 360 Flatmates. A flatmate profile appears in onboarding, the swipe deck, the chat thread, and the compatibility engine. A listing appears on discover, in the dashboard, on the map, and in a visit. A notification appears in the bell, in push, and over SSE. Because these objects cross so many boundaries, their shape, status states, and validation are centralized rather than redefined per feature.

Each primitive page below documents the canonical TypeScript type (in `src/lib/api/types/` or `src/lib/compatibility/types.ts`), the Zod schema that validates it on the client (in `src/lib/schemas/`), and the domain enums that constrain its values (in `src/lib/data/domain.ts`).

## Primitive pages

- [Flatmate profile](flatmate-profile.md) - the core user object: modes, status states, lifestyle fields, and the peer subset used in matching.
- [Listing and property](listing-property.md) - a room or flat posted by a room poster, with lifecycle and moderation status, boost, and renew.
- [Compatibility profile](compatibility-profile.md) - the lifestyle-only subset of a flatmate profile that the compatibility engine reads, plus the result shape it produces.
- [Lifestyle dimensions](lifestyle-dimensions.md) - the six scored axes (sleep, cleanliness, food, smoking and drinking, guests, work), their options, weights, and scorers.
- [Visit](visit.md) - a scheduled property tour or flatmate meet, with its five-state lifecycle.
- [Conversation and message](conversation-message.md) - a chat thread between two flatmates and the messages that flow through it.
- [Notification](notification.md) - an in-app notification, with its read state and mapping to real-time SSE events.

For project-specific terminology used across these pages, see the [glossary](../overview/glossary.md).
