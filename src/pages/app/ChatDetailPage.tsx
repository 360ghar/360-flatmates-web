import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useConversation,
  useMessages,
  useSendMessage,
  useMyProfile,
  useCreateVisit,
  useReportUserMutation,
  useMarkConversationRead
} from "@/hooks/queries";
import { apiClient } from "@/lib/api";
import { messageToChatBubbleProps } from "@/lib/api/adapters";
import type { ChatMessageData } from "@/components/molecules/ChatMessageBubble";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import {
  ChatThread,
  type ChatThreadParticipant,
  type ChatReportReason
} from "@/components/organisms/ChatThread";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import { uiStore } from "@/lib/stores/ui-store";
import { chatStore } from "@/lib/stores/chat-store";
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
  const { data: myProfile } = useMyProfile();
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
      <div className="flex items-center justify-center p-8">
        <ErrorState title="Invalid conversation" description="The conversation ID is not valid." />
      </div>
    );
  }

  if (convLoading || messagesLoading) {
    return (
      <div className="p-0 md:p-2">
        <Skeleton variant="chatThread" />
      </div>
    );
  }

  if (convError || messagesError) {
    return (
      <div className="flex items-center justify-center p-8">
        <ErrorState
          title="Could not load conversation"
          description="Please try again."
          onRetry={() => { refetchConversation(); refetchMessages(); }}
        />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center p-8">
        <ErrorState title="Conversation not found" />
      </div>
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
    />
  );
}
