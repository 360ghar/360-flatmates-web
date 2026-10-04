import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConversation, useMessages, useSendMessage, useMarkConversationRead } from "@/features/chat/hooks/useConversations";
import { useMyProfile } from "@/hooks/queries/useProfiles";
import { useCreateVisit } from "@/features/visits/hooks/useVisits";
import { useReportUserMutation } from "@/hooks/queries/useReports";
import { apiClient } from "@/lib/api";
import { messageToChatBubbleProps } from "@/features/chat/lib/adapters";
import type { ChatMessageData } from "@/features/chat/components/ChatMessageBubble";
import { ChatThreadSkeleton } from "@/features/chat/components/ChatThreadSkeleton";
import { ErrorState } from "@/components/ui/StateViews";
import {
  ChatThread,
  type ChatThreadParticipant,
  type ChatReportReason
} from "@/features/chat/components/ChatThread";
import { useRealtimeStatus } from "@/features/chat/hooks/useRealtimeStatus";
import { uiStore } from "@/lib/stores/ui-store";
import { chatStore } from "@/features/chat/store";
import type { MessageOut } from "@/lib/api/types";

const NO_FAILED_SENDS: MessageOut[] = [];

export function ChatDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const conversationId = Number(id);

  const { data: conversation, isLoading: convLoading, error: convError, refetch: refetchConversation } = useConversation(conversationId);
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMessages(conversationId);
  const { data: myProfile, error: profileError, refetch: refetchProfile } = useMyProfile();
  const sendMessage = useSendMessage();
  const createVisit = useCreateVisit();
  const reportUser = useReportUserMutation();
  const markRead = useMarkConversationRead();
  const { isConnected: realtimeConnected } = useRealtimeStatus();

  // Block-create has no dedicated hook in useBlocks.ts yet (see SHARED
  // FINDINGS); co-locate the mutation here so the chat safety action works.
  const blockUser = useMutation({
    mutationFn: (blockedUserId: number) =>
      apiClient.request<{ message?: string }>({
        method: "POST",
        path: "/flatmates/blocks",
        body: { blocked_user_id: blockedUserId }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });

  const failedSends = useStore(
    chatStore,
    (state) => state.failedSends[conversationId] ?? NO_FAILED_SENDS
  );

  // Audit F6 #4: mark conversation as read on mount and whenever the tab
  // regains visibility. Guard against spamming while a call is in flight.
  const markReadRef = useRef(markRead);
  useEffect(() => {
    markReadRef.current = markRead;
  });
  useEffect(() => {
    if (!Number.isFinite(conversationId) || conversationId <= 0) return;
    if (!markReadRef.current.isIdle) return;
    markReadRef.current.mutate(conversationId);

    function onVisibility() {
      if (document.visibilityState === "visible" && markReadRef.current.isIdle) {
        markReadRef.current.mutate(conversationId);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [conversationId]);

  const myUserId = myProfile?.id ?? 0;
  const messages = useMemo<ChatMessageData[]>(() => {
    const flat = messagesData?.pages.flatMap((p) => p.messages) ?? [];
    const sent = flat.map((msg) => {
      const base = messageToChatBubbleProps(msg, myUserId);
      return msg.id < 0 ? { ...base, status: "sending" as const } : base;
    });
    const failed = failedSends.map((msg) => ({
      ...messageToChatBubbleProps(msg, myUserId),
      status: "failed" as const
    }));
    return [...sent, ...failed];
  }, [messagesData, myUserId, failedSends]);

  const sendBody = useCallback(
    (body: string, retryTempId?: number) => {
      if (!myUserId) return; // Send stays disabled until the profile loads.
      sendMessage.mutate({
        conversationId,
        payload: { body },
        senderId: myUserId,
        ...(retryTempId !== undefined ? { tempId: retryTempId } : {})
      });
    },
    [conversationId, myUserId, sendMessage]
  );

  const handleSend = useCallback((message: string) => sendBody(message), [sendBody]);

  const handleRetryMessage = useCallback(
    (messageId: string) => {
      const tempId = Number(messageId);
      const failed = failedSends.find((m) => m.id === tempId);
      if (failed?.body) sendBody(failed.body, tempId);
    },
    [failedSends, sendBody]
  );

  if (Number.isNaN(conversationId) || conversationId <= 0) {
    return (
      <ThreadMessage>
        <ErrorState title="Conversation not found" description="This link does not point to a chat." />
      </ThreadMessage>
    );
  }

  if (convLoading || messagesLoading) {
    return <ChatThreadSkeleton className="h-full" />;
  }

  if (convError || messagesError) {
    return (
      <ThreadMessage>
        <ErrorState
          title="Could not load the chat"
          description="Check your connection and try again."
          onRetry={() => { refetchConversation(); refetchMessages(); }}
        />
      </ThreadMessage>
    );
  }

  if (!conversation) {
    return (
      <ThreadMessage>
        <ErrorState title="Conversation not found" />
      </ThreadMessage>
    );
  }

  // conversation is narrowed to non-null by the guard above
  const conv = conversation;

  const participant: ChatThreadParticipant = {
    name: conv.peer.full_name,
    avatarUrl: conv.peer.profile_image_url,
    mode: conv.peer.mode,
    verified: false,
    compatibilityScore: conv.peer.match_percentage
  };

  function handleScheduleVisit(data: { scheduledDate: string; specialRequirements: string }) {
    const propertyId = conv.context_property?.id;
    if (!propertyId) {
      uiStore.getState().pushToast({
        type: "info",
        title: "Cannot schedule",
        description: "No property is linked to this conversation."
      });
      return;
    }

    createVisit.mutate({
      property_id: propertyId,
      scheduled_date: data.scheduledDate,
      conversation_id: conversationId,
      counterparty_user_id: conv.peer.id,
      special_requirements: data.specialRequirements || undefined,
      visit_context: "property_tour"
    }, {
      onSuccess: () => {
        uiStore.getState().pushToast({
          type: "success",
          title: "Visit scheduled",
          description: `Visit scheduled for ${data.scheduledDate}`
        });
      }
    });
  }

  function handleBlock() {
    blockUser.mutate(conv.peer.id, {
      onSuccess: () => {
        uiStore.getState().pushToast({ type: "success", title: "User blocked" });
        navigate("/chats");
      },
      onError: () => {
        uiStore.getState().pushToast({ type: "error", title: "Could not block user" });
      }
    });
  }

  function handleReport(reason: ChatReportReason, notes: string) {
    reportUser.mutate(
      { reported_user_id: conv.peer.id, reason, notes },
      {
        onSuccess: () => {
          uiStore.getState().pushToast({ type: "success", title: "Report submitted" });
        },
        onError: () => {
          uiStore.getState().pushToast({ type: "error", title: "Could not submit report" });
        }
      }
    );
  }

  return (
    <ChatThread
      onBack={() => navigate("/chats")}
      participant={participant}
      messages={messages}
      onSend={handleSend}
      onRetryMessage={handleRetryMessage}
      onBlock={handleBlock}
      onReport={handleReport}
      onScheduleVisit={handleScheduleVisit}
      onLoadMore={hasNextPage ? () => fetchNextPage() : undefined}
      loadingMore={isFetchingNextPage}
      sending={sendMessage.isPending || !myUserId}
      disconnected={!realtimeConnected}
      notice={
        profileError && !myUserId ? (
          <div role="alert" className="flex items-center justify-between gap-3 bg-danger-soft px-4 py-2 text-body-sm text-ink">
            <span>Could not load your profile, so you cannot send messages yet.</span>
            <button type="button" onClick={() => void refetchProfile()} className="min-h-11 shrink-0 px-2 font-semibold text-danger">
              Retry
            </button>
          </div>
        ) : null
      }
    />
  );
}

/** A state message where the thread would be, filling the same space. */
function ThreadMessage({ children }: { children: ReactNode }) {
  return <div className="paper-grain grid h-full place-items-center bg-surface p-6 md:rounded-hand md:shadow-sm">{children}</div>;
}
