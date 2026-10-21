import type { FlatmatesPeer } from "./user.types";

/** Shown for a peer with no name: `FlatmatesPeer.full_name` can be null. */
export const PEER_NAME_FALLBACK = "A flatmate";

export function peerName(peer: Pick<FlatmatesPeer, "full_name">): string {
  return peer.full_name?.trim() || PEER_NAME_FALLBACK;
}
