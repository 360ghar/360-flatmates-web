import type { ConversationSummary, MessageOut } from "@/lib/api/types";
import type { FlatmatesMode } from "@/lib/data";
import type { ConversationRowData } from "@/features/chat/components/ConversationRow";
import type { ChatMessageData } from "@/features/chat/components/ChatMessageBubble";
import { formatMessageTime, formatRelativeTime } from "@/lib/utils";

/** Map API conversation to ConversationRowData for the ConversationRow component */
export function conversationToConversationRowProps(
  conversation: ConversationSummary
): ConversationRowData {
  return {
    id: String(conversation.id),
    name: conversation.peer.full_name,
    avatarUrl: conversation.peer.profile_image_url,
    mode: conversation.peer.mode as FlatmatesMode | undefined,
    preview: conversation.last_message_preview ?? "",
    propertyPreview: conversation.context_property?.title,
    timestamp: formatRelativeTime(conversation.last_message_at),
    unreadCount: conversation.unread_count
  };
}

/** Map API message to ChatMessageData for the ChatMessageBubble component */
export function messageToChatBubbleProps(
  message: MessageOut,
  currentUserId: number
): ChatMessageData {
  const isOwn = message.sender_id === currentUserId;

  return {
    id: String(message.id),
    sender: isOwn ? "me" : "them",
    text: message.body ?? "",
    timestamp: formatMessageTime(message.created_at),
    status: isOwn ? (message.read_at ? "read" : "sent") : undefined,
    avatarUrl: undefined, // Avatar comes from conversation peer context
    senderName: undefined
  };
}
