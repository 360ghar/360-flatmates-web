import type {
  AlertChannel,
  AlertFrequency,
  BoostDuration,
  Cleanliness,
  CompatibilityColor,
  ConversationSource,
  ConversationStatus,
  DevicePlatform,
  FlatmatesMode,
  FlatmatesProfileStatus,
  FoodHabits,
  GenderPreference,
  GuestsPolicy,
  LifestyleDimensionKey,
  ListingSharingType,
  MessageType,
  ModerationAction,
  MoveInTimeline,
  NonNegotiable,
  PropertyLifecycleStatus,
  PropertyModerationStatus,
  PropertyPurpose,
  PropertyType,
  ReportAction,
  ReportStatus,
  SearchSort,
  SearchType,
  ShareCardFormat,
  SleepSchedule,
  SmokingDrinking,
  SocietyTagVoteDirection,
  SocietyType,
  SwipeAction,
  SwipeTargetType,
  UserMatchStatus,
  UserReportReason,
  UserRole,
  UserReportStatus,
  VisitContext,
  VisitStatus,
  WorkStyle,
  InterestLevel
} from "@/lib/data";

export type {
  AlertChannel,
  AlertFrequency,
  BoostDuration,
  Cleanliness,
  CompatibilityColor,
  ConversationSource,
  ConversationStatus,
  DevicePlatform,
  FlatmatesMode,
  FlatmatesProfileStatus,
  FoodHabits,
  GenderPreference,
  GuestsPolicy,
  LifestyleDimensionKey,
  ListingSharingType,
  MessageType,
  ModerationAction,
  MoveInTimeline,
  NonNegotiable,
  PropertyLifecycleStatus,
  PropertyModerationStatus,
  PropertyPurpose,
  PropertyType,
  ReportAction,
  ReportStatus,
  SearchSort,
  SearchType,
  ShareCardFormat,
  SleepSchedule,
  SmokingDrinking,
  SocietyTagVoteDirection,
  SocietyType,
  SwipeAction,
  SwipeTargetType,
  UserMatchStatus,
  UserReportReason,
  UserRole,
  UserReportStatus,
  VisitContext,
  VisitStatus,
  WorkStyle
};

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
export type JsonObject = { readonly [key: string]: JsonValue };

export interface CatalogEntry {
  key: string;
  version: number;
  payload: JsonObject;
}

export interface CatalogsResponse {
  catalogs: CatalogEntry[];
}

export interface CatalogCity {
  id: number;
  name: string;
  state?: string;
  is_active: boolean;
}

export interface CatalogLocality {
  id: number;
  name: string;
  city_id: number;
  city_name?: string;
}

export interface CatalogAmenity {
  id: number;
  name: string;
  category?: string;
  icon?: string;
}

export interface RegisterDevicePayload {
  device_token: string;
  platform?: DevicePlatform;
}

export interface ShareCardResponse {
  card_url: string;
  format: ShareCardFormat;
  expires_at?: string;
}
