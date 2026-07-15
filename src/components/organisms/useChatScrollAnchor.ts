import { type RefObject, useLayoutEffect, useRef } from "react";
import type { ChatMessageData } from "../molecules/ChatMessageBubble";

/** Distance from the bottom (px) within which we consider the user "at bottom". */
const AT_BOTTOM_THRESHOLD = 96;

/**
 * Keeps the message log scrolled sensibly across history-prepends and new
 * appends: anchors to the same visual position when older messages load at
 * the top, and only auto-scrolls to the new bottom when the user was already
 * there. Also triggers `onLoadMore` when the user scrolls to the top.
 */
export function useChatScrollAnchor(
  logRef: RefObject<HTMLDivElement | null>,
  messages: ChatMessageData[],
  onLoadMore?: () => void
) {
  const atBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);
  const prevFirstIdRef = useRef<string | null>(null);
  const scrollSnapshotRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);

  function recomputeAtBottom() {
    const el = logRef.current;
    if (!el) return;
    atBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <= AT_BOTTOM_THRESHOLD;
  }

  function handleScroll() {
    recomputeAtBottom();
    if (logRef.current && logRef.current.scrollTop === 0 && onLoadMore) {
      onLoadMore();
    }
  }

  /* Scroll management: detect prepend (history) vs append (new message) and
     anchor/scroll accordingly. All ref access is inside useLayoutEffect to
     satisfy the react-hooks/refs lint rule. Runs before paint. */
  useLayoutEffect(() => {
    const el = logRef.current;
    if (!el) return;

    const countChanged = messages.length !== prevMsgCountRef.current;
    const currentFirstId = messages.length > 0 ? messages[0].id : null;
    const isPrepend = countChanged
      && prevFirstIdRef.current !== null
      && currentFirstId !== null
      && currentFirstId !== prevFirstIdRef.current;

    if (isPrepend && scrollSnapshotRef.current) {
      // History prepended: anchor to keep the same visual position.
      // Use the previously-first message's offsetTop to avoid overcounting
      // any appended messages that may also be in this render cycle.
      const { scrollTop } = scrollSnapshotRef.current;
      const oldFirstId = prevFirstIdRef.current;
      if (oldFirstId) {
        const oldFirstEl = el.querySelector<HTMLElement>(`[data-message-id="${oldFirstId}"]`);
        if (oldFirstEl) {
          el.scrollTop = scrollTop + oldFirstEl.offsetTop;
        } else {
          el.scrollTop = el.scrollHeight;
        }
      } else {
        el.scrollTop = el.scrollHeight;
      }
      scrollSnapshotRef.current = null;
    } else if (countChanged && messages.length > 0) {
      if (scrollSnapshotRef.current && atBottomRef.current) {
        // Appended while at bottom: scroll to new end.
        el.scrollTop = el.scrollHeight;
        scrollSnapshotRef.current = null;
      } else if (prevMsgCountRef.current === 0) {
        // Initial load: scroll to bottom.
        el.scrollTop = el.scrollHeight;
      }
    }

    // Snapshot current scroll state for the next change detection cycle.
    scrollSnapshotRef.current = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
    };
    prevMsgCountRef.current = messages.length;
    prevFirstIdRef.current = currentFirstId;
  }, [messages, logRef]);

  return { atBottomRef, handleScroll };
}
