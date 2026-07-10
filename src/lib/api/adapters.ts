import type {
  Property,
  FlatmatesPeer,
  ConversationSummary,
  Visit as ApiVisit,
  FlatmatesNotification,
  MessageOut
} from "@/lib/api/types";
import type { FlatmatesMode, VisitContext, VisitStatus as ApiVisitStatus } from "@/lib/data";
import type {
  ListingCardData,
  ProfileGridCardData,
  ConversationRowData,
  VisitCardData,
  NotificationCardData,
  ChatMessageData,
  VisitType,
  VisitStatus as ComponentVisitStatus,
  NotificationType
} from "@/components/molecules";
import { formatLocation, formatRelativeTime, formatMessageTime } from "@/lib/utils";

/** Map API property type to ListingCardData for the ListingCard component */
export function propertyToListingCardProps(property: Property): ListingCardData {
  return {
    id: String(property.id),
    title: property.title,
    price: property.monthly_rent,
    imageUrl: property.main_image_url,
    locality: property.locality,
    city: property.city,
    beds: property.bedrooms,
    baths: property.bathrooms,
    areaSqFt: property.area_sqft,
    features: property.features,
    owner: property.owner
      ? {
          name: property.owner.full_name,
          avatarUrl: property.owner.profile_image_url
        }
      : property.owner_name
        ? { name: property.owner_name }
        : undefined,
    interestCount: property.interest_count,
    description: property.description,
    compatibilityScore: property.compatibility_score ?? undefined
  };
}

/** Map API peer profile to ProfileGridCardData for the ProfileGridCard component */
export function profileToProfileGridCardProps(profile: FlatmatesPeer): ProfileGridCardData {
  const location = formatLocation(profile.locality, profile.city);

  return {
    id: String(profile.id),
    name: profile.full_name,
    age: profile.age,
    location: location || undefined,
    profession: profile.profession,
    photoUrl: profile.profile_image_url,
    matchScore: profile.match_percentage ?? 0
  };
}

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
    unreadCount: conversation.unread_count,
    highlighted: false
  };
}

/** Map API visit context to component visit type */
function mapVisitContext(context: VisitContext): VisitType {
  return context === "property_tour" ? "Property Tour" : "Flatmate Meet";
}

/** Map API visit status to component visit status */
function mapVisitStatus(status: ApiVisitStatus): ComponentVisitStatus {
  const statusMap: Record<ApiVisitStatus, ComponentVisitStatus> = {
    requested: "pending",
    confirmed: "confirmed",
    reschedule_suggested: "pending",
    cancelled: "cancelled",
    completed: "completed"
  };
  return statusMap[status] ?? "pending";
}

/** Map API visit to VisitCardData for the VisitCard component */
export function visitToVisitCardProps(visit: ApiVisit): VisitCardData {
  return {
    id: String(visit.id),
    propertyTitle: visit.property_title ?? `Property #${visit.property_id}`,
    propertyImageUrl: undefined, // Not directly on visit; would need property lookup
    type: mapVisitContext(visit.visit_context),
    dateTime: visit.scheduled_date,
    status: mapVisitStatus(visit.status)
  };
}

/** Map API notification type string to component NotificationType */
function mapNotificationType(apiType: string): NotificationType {
  const typeMap: Record<string, NotificationType> = {
    new_match: "new_match",
    new_message: "new_message",
    listing_approved: "listing_approved",
    listing_rejected: "listing_rejected",
    visit_scheduled: "visit_scheduled",
    visit_confirmed: "visit_confirmed"
  };
  return typeMap[apiType] ?? "general";
}

/** Map API notification to NotificationCardData for the NotificationCard component */
export function notificationToNotificationCardProps(
  notification: FlatmatesNotification
): NotificationCardData {
  return {
    id: String(notification.id),
    type: mapNotificationType(notification.type),
    title: notification.title,
    description: notification.body,
    timestamp: formatRelativeTime(notification.created_at),
    unread: !notification.is_read
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
