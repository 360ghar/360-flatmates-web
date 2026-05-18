import { useMemo } from "react";
import { useParams } from "react-router";
import { useConversation, useMessages, useSendMessage, useMyProfile, useCreateVisit } from "@/hooks/queries";
import { messageToChatBubbleProps } from "@/lib/api/adapters";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { ChatThread, type ChatThreadParticipant } from "@/components/organisms/ChatThread";
import { uiStore } from "@/lib/stores/ui-store";

export function ChatDetailPage() {
  const { id } = useParams();
  const conversationId = Number(id);

  const { data: conversation, isLoading: convLoading, error: convError } = useConversation(conversationId);
  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = useMessages(conversationId);
  const { data: myProfile } = useMyProfile();
  const sendMessage = useSendMessage();
  const createVisit = useCreateVisit();

  const myUserId = myProfile?.id ?? 0;
  const messages = useMemo(
    () => (messagesData?.messages ?? []).map((msg) => messageToChatBubbleProps(msg, myUserId)),
    [messagesData?.messages, myUserId]
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
      <div className="flex flex-col gap-3 p-4">
        {/* Header bar: avatar + name + actions */}
        <div className="flex items-center gap-3 border-b border-line pb-3">
          <div className="shimmer animate-shimmer motion-reduce:animate-none h-[52px] w-[52px] shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-1.5 min-w-0">
            <div className="shimmer animate-shimmer motion-reduce:animate-none h-4 w-28 rounded-sm" />
            <div className="shimmer animate-shimmer motion-reduce:animate-none h-3 w-20 rounded-sm" />
          </div>
          <div className="flex gap-2">
            <div className="shimmer animate-shimmer motion-reduce:animate-none h-9 w-9 rounded-[9px]" />
            <div className="shimmer animate-shimmer motion-reduce:animate-none h-9 w-9 rounded-[9px]" />
          </div>
        </div>
        {/* Alternating chat message bubbles */}
        <Skeleton variant="chatMessage" />
        <div className="flex justify-end"><Skeleton variant="chatMessage" side="right" /></div>
        <Skeleton variant="chatMessage" />
        <div className="flex justify-end"><Skeleton variant="chatMessage" side="right" /></div>
        {/* Input bar */}
        <div className="mt-auto flex items-center gap-2 rounded-[9px] border border-line bg-surface p-3">
          <div className="shimmer animate-shimmer motion-reduce:animate-none h-5 w-5 rounded-sm" />
          <div className="shimmer animate-shimmer motion-reduce:animate-none h-4 flex-1 rounded-sm" />
          <div className="shimmer animate-shimmer motion-reduce:animate-none h-8 w-8 rounded-[9px]" />
        </div>
      </div>
    );
  }

  if (convError || messagesError) {
    return (
      <div className="flex items-center justify-center p-8">
        <ErrorState
          title="Could not load conversation"
          description="Please try again."
          onRetry={() => window.location.reload()}
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

  const participant: ChatThreadParticipant = {
    name: conversation.peer.full_name,
    avatarUrl: conversation.peer.profile_image_url,
    mode: conversation.peer.mode,
    verified: false,
    compatibilityScore: conversation.peer.match_percentage
  };

  function handleSend(message: string) {
    sendMessage.mutate({
      conversationId,
      payload: { body: message }
    });
  }

  function handleScheduleVisit(data: { scheduledDate: string; specialRequirements: string }) {
    const propertyId = conversation?.context_property?.id;
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
      counterparty_user_id: conversation.peer.id,
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

  return (
    <ChatThread
      participant={participant}
      messages={messages}
      onSend={handleSend}
      onScheduleVisit={handleScheduleVisit}
    />
  );
}
