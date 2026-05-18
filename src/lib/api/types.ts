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

export interface User {
  id: number;
  email?: string;
  phone?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  created_at?: string;
  preferences?: JsonObject;
}

export interface UserLocation {
  city?: string;
  locality?: string;
  lat?: number;
  lng?: number;
}

export interface CatalogEntry {
  key: string;
  version: number;
  payload: JsonObject;
}

export interface FlatmatesProfile {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  profile_image_url?: string;
  mode: FlatmatesMode;
  profile_status?: FlatmatesProfileStatus;
  onboarding_completed: boolean;
  onboarding_current_step?: number;
  bio?: string;
  age?: number;
  profession?: string;
  budget_min?: number;
  budget_max?: number;
  move_in_timeline?: MoveInTimeline;
  city?: string;
  locality?: string;
  sleep_schedule?: SleepSchedule;
  cleanliness?: Cleanliness;
  food_habits?: FoodHabits;
  smoking_drinking?: SmokingDrinking;
  guests_policy?: GuestsPolicy;
  work_style?: WorkStyle;
  gender?: string;
  gender_preference?: GenderPreference;
  preferences?: JsonObject;
  last_active_at?: string;
}

export type FlatmatesProfileUpdate = Partial<
  Omit<FlatmatesProfile, "id" | "email" | "phone" | "last_active_at">
>;

export interface FlatmatesPeer {
  id: number;
  full_name: string;
  profile_image_url?: string;
  mode: FlatmatesMode;
  city?: string;
  locality?: string;
  age?: number;
  profession?: string;
  bio?: string;
  budget_min?: number;
  budget_max?: number;
  move_in_timeline?: MoveInTimeline;
  sleep_schedule?: SleepSchedule;
  cleanliness?: Cleanliness;
  food_habits?: FoodHabits;
  smoking_drinking?: SmokingDrinking;
  guests_policy?: GuestsPolicy;
  work_style?: WorkStyle;
  gender?: string;
  gender_preference?: GenderPreference;
  non_negotiables?: NonNegotiable[];
  has_pets?: boolean;
  party_habit?: string;
  match_percentage?: number;
  phone_number?: string;
}

export interface FlatmatesBootstrap {
  profile: FlatmatesProfile;
  catalogs: CatalogEntry[];
  active_listing_count: number;
  conversation_count: number;
  unread_message_count: number;
}

export interface SwipeRequest {
  target_type: SwipeTargetType;
  action: SwipeAction;
  property_id?: number;
  target_user_id?: number;
  context_property_id?: number;
}

export interface SwipeResult {
  stored?: boolean;
  action: SwipeAction;
  target_type: SwipeTargetType;
  conversation_id?: number;
  match_id?: number;
  did_match?: boolean;
}


export interface ConversationPropertyContext {
  id: number;
  title: string;
  locality?: string;
  city?: string;
  monthly_rent?: number;
  main_image_url?: string;
  owner_name?: string;
  owner_image_url?: string;
}

export interface IncomingLikeSummary {
  id: number;
  peer: FlatmatesPeer;
  context_property?: ConversationPropertyContext;
  created_at?: string;
}

export interface MatchSummary {
  id: number;
  status: UserMatchStatus;
  peer: FlatmatesPeer;
  context_property?: ConversationPropertyContext;
  created_at?: string;
}

export interface ConversationQnAAnswer {
  user_id: number;
  q1?: string;
  q2?: string;
  q3?: string;
}

export interface ConversationQnAState {
  current_user?: ConversationQnAAnswer;
  peer?: ConversationQnAAnswer;
  both_answered?: boolean;
}

export interface ConversationSummary {
  id: number;
  source: ConversationSource;
  status: ConversationStatus;
  peer: FlatmatesPeer;
  context_property?: ConversationPropertyContext;
  last_message_preview?: string;
  last_message_at?: string;
  unread_count?: number;
  matched_at?: string;
  qna?: ConversationQnAState;
}

export interface MessageCreate {
  body?: string;
  attachment_url?: string;
  message_type?: MessageType;
  metadata?: JsonObject;
}

export interface MessageOut {
  id: number;
  conversation_id: number;
  sender_id: number;
  body?: string;
  attachment_url?: string;
  message_type: MessageType;
  metadata?: JsonObject;
  read_at?: string;
  created_at?: string;
}

export interface QnAAnswers {
  answers: Record<string, string>;
}

export interface VisitCreate {
  property_id: number;
  visit_context?: VisitContext;
  scheduled_date: string;
  conversation_id?: number;
  counterparty_user_id?: number;
  match_id?: number;
  special_requirements?: string;
  visit_notes?: string;
}

export interface VisitUpdate {
  status?: VisitStatus;
  scheduled_date?: string;
  special_requirements?: string;
  visit_notes?: string;
  visitor_feedback?: string;
  interest_level?: InterestLevel;
  follow_up_required?: boolean;
  follow_up_date?: string;
}

export interface VisitReschedule {
  new_date: string;
  reason?: string;
}

export interface VisitCancel {
  reason?: string;
}

export interface VisitComplete {
  notes?: string;
  feedback?: string;
}

export interface Visit {
  id: number;
  user_id?: number;
  property_id: number;
  property_title?: string;
  agent_id?: number;
  counterparty_user_id?: number;
  conversation_id?: number;
  match_id?: number;
  visit_context: VisitContext;
  scheduled_date: string;
  actual_date?: string;
  status: VisitStatus;
  special_requirements?: string;
  visit_notes?: string;
  visitor_feedback?: string;
  interest_level?: InterestLevel;
  follow_up_required?: boolean;
  follow_up_date?: string;
  cancellation_reason?: string;
  rescheduled_from?: string;
  created_at?: string;
}

export interface VisitList {
  visits: Visit[];
  total: number;
}

export type VisitSlice = VisitList;


export interface PropertyCreate {
  property_type: PropertyType;
  purpose: PropertyPurpose;
  title: string;
  description?: string;
  city: string;
  state?: string;
  locality: string;
  sub_locality?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  monthly_rent: number;
  security_deposit?: number;
  maintenance_charges?: number;
  area_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  tags?: string[];
  main_image_url?: string;
  image_urls?: string[];
  available_from?: string;
  gender_preference?: GenderPreference;
  sharing_type?: ListingSharingType;
  video_tour_url?: string;
  society_type?: SocietyType;
  society_amenities?: string[];
  society_vibe_tags?: string[];
  listing_preferences?: JsonObject;
}

export type PropertyUpdate = Partial<Omit<PropertyCreate, "property_type" | "purpose">> & {
  is_available?: boolean;
};

export interface PropertyOwner {
  id: number;
  full_name: string;
  profile_image_url?: string;
  phone?: string;
}

export interface Property {
  id: number;
  owner_id?: number;
  property_type: PropertyType;
  purpose: PropertyPurpose;
  title: string;
  description?: string;
  city: string;
  state?: string;
  locality: string;
  sub_locality?: string;
  latitude?: number;
  longitude?: number;
  monthly_rent: number;
  main_image_url?: string;
  image_urls?: string[];
  area_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  tags?: string[];
  owner_name?: string;
  available_from?: string;
  gender_preference?: GenderPreference;
  sharing_type?: ListingSharingType;
  video_tour_url?: string;
  security_deposit?: number;
  maintenance_charges?: number;
  society_type?: SocietyType;
  society_amenities?: string[];
  society_vibe_tags?: string[];
  interest_count?: number;
  view_count?: number;
  like_count?: number;
  is_available?: boolean;
  created_at?: string;
  preferences?: JsonObject;
  status?: PropertyLifecycleStatus;
  property_status?: PropertyModerationStatus;
  expires_at?: string;
  distance_km?: number;
  liked?: boolean | null;
  user_has_scheduled_visit?: boolean;
  user_scheduled_visit_count?: number;
  user_next_visit_date?: string;
  owner?: PropertyOwner;
}

export interface PaginatedPropertyResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters_applied?: JsonObject;
  search_center?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface SearchFilters {
  q?: string;
  search_type?: SearchType;
  lat?: number;
  lng?: number;
  radius?: number;
  property_type?: PropertyType[];
  purpose?: PropertyPurpose;
  city?: string;
  locality?: string;
  sub_locality?: string;
  price_min?: number;
  price_max?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  sharing_type?: ListingSharingType[];
  gender_preference?: GenderPreference[];
  move_in?: MoveInTimeline[];
  available_from?: string;
  amenities?: string[];
  features?: string[];
  society_type?: SocietyType;
  society_vibe_tags?: string[];
  sort_by?: SearchSort;
  semantic_search?: boolean;
  exclude_swiped?: boolean;
  page?: number;
  limit?: number;
}

export interface WebSearchResponse {
  results: Array<Property | FlatmatesPeer>;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  search_type: SearchType;
  filters_applied?: JsonObject;
  search_center?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface SavedSearchCreate {
  name: string;
  filters: SearchFilters;
  alert_enabled?: boolean;
  alert_frequency?: AlertFrequency;
  alert_channels?: AlertChannel[];
}

export type SavedSearchUpdate = Partial<SavedSearchCreate>;

export interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  filters: SearchFilters;
  alert_enabled: boolean;
  alert_frequency: AlertFrequency;
  alert_channels: AlertChannel[];
  last_run_at?: string;
  new_results_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SearchAlertCreate {
  name: string;
  filters: SearchFilters;
  frequency?: AlertFrequency;
  channels?: AlertChannel[];
}

export interface SearchAlertUpdate {
  name?: string;
  frequency?: AlertFrequency;
  channels?: AlertChannel[];
  enabled?: boolean;
}

export interface SearchAlert {
  id: number;
  user_id: number;
  name: string;
  filters: SearchFilters;
  frequency: AlertFrequency;
  channels: AlertChannel[];
  enabled: boolean;
  last_sent_at?: string;
  results_sent_count?: number;
  created_at?: string;
}

export interface MapCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  type_breakdown?: {
    room_available?: number;
    co_hunter?: number;
  };
  price_range?: {
    min?: number;
    max?: number;
  };
}

export interface MapPin {
  id: number;
  lat: number;
  lng: number;
  title: string;
  locality?: string;
  monthly_rent?: number;
  main_image_url?: string;
  mode?: FlatmatesMode;
  sharing_type?: ListingSharingType;
  is_available?: boolean;
  move_in_timeline?: MoveInTimeline;
}

export interface MapViewFilters {
  lat: number;
  lng: number;
  radius?: number;
  zoom_level?: number;
  property_type?: PropertyType[];
  price_min?: number;
  price_max?: number;
  move_in?: MoveInTimeline[];
  sharing_type?: ListingSharingType[];
}

export interface MapViewResponse {
  clusters: MapCluster[];
  pins: MapPin[];
  bounds?: {
    north?: number;
    south?: number;
    east?: number;
    west?: number;
  };
  total_listings: number;
}

export interface CityStats {
  city: string;
  active_users: number;
  total_listings: number;
  new_listings_7d: number;
  total_matches_7d: number;
  match_rate: number;
  is_waitlist: boolean;
}

export interface ListingAnalytics {
  listing_id: number;
  period: "7d" | "30d" | "all" | string;
  total_views: number;
  unique_views: number;
  likes: number;
  shares: number;
  conversations_started: number;
  visits_scheduled: number;
  daily_stats: Array<{
    date: string;
    views: number;
    likes: number;
    shares: number;
  }>;
  boost_active: boolean;
  boost_expires_at?: string | null;
}

export interface RoomPosterDashboard {
  total_listings: number;
  active_listings: number;
  pending_review: number;
  paused: number;
  total_views_30d: number;
  total_likes_30d: number;
  total_conversations_30d: number;
  total_visits_30d: number;
  listings: Array<{
    id: number;
    title: string;
    status: string;
    views: number;
    likes: number;
    conversations: number;
    days_until_expiry: number;
    boost_active: boolean;
  }>;
}


export interface CompatibilityDimension {
  name: LifestyleDimensionKey;
  weight: number;
  user_value?: string;
  peer_value?: string;
  score: number;
  match: boolean;
}

export interface CompatibilityBreakdown {
  user_id: number;
  peer_id: number;
  overall_percentage: number;
  color: CompatibilityColor;
  dimensions: CompatibilityDimension[];
  summary: string[];
}

export interface FlatmatesNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  reference_id?: number | null;
  route?: string | null;
  created_at?: string;
}

export interface MarkNotificationReadPayload {
  is_read: boolean;
}

export interface MarkAllNotificationsReadPayload {
  mark_all_read: boolean;
}

export interface ConversationCreate {
  match_id?: number;
  peer_user_id: number;
  context_property_id?: number;
  initial_message?: string;
}

export interface MessageListResponse {
  messages: MessageOut[];
  total: number;
  has_more: boolean;
}


export interface ListingModerationPayload {
  action: ModerationAction;
  reason?: string;
}

export interface FlatmateListingAdmin {
  id: number;
  title: string;
  owner_id: number;
  owner_name: string;
  owner_phone?: string;
  city: string;
  locality: string;
  monthly_rent: number;
  main_image_url?: string;
  image_urls?: string[];
  description?: string;
  moderation_status: PropertyModerationStatus;
  created_at?: string;
  ai_prescreen_result?: JsonObject;
  ai_prescreen_flags?: string[];
  ai_prescreen_reason?: string;
}

export interface AdminListingsResponse {
  listings: FlatmateListingAdmin[];
  total: number;
  limit: number;
  offset: number;
}


export interface ReportAdmin {
  id: number;
  reporter_user_id: number;
  reporter_name: string;
  reported_user_id: number;
  reported_name: string;
  conversation_id?: number | null;
  property_id?: number | null;
  reason: string;
  status: ReportStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminReportsResponse {
  reports: ReportAdmin[];
  total: number;
  limit: number;
  offset: number;
}


export interface ReportActionPayload {
  action: ReportAction;
  notes?: string;
}

export interface AdminStats {
  total_users: number;
  total_listings: number;
  pending_moderation: number;
  total_matches: number;
  total_visits: number;
  active_conversations: number;
}

export interface DashboardStats {
  total_listings: number;
  active_listings: number;
  pending_review: number;
  total_views_30d: number;
  total_likes_30d: number;
  total_conversations_30d: number;
  total_visits_30d: number;
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

export interface SwipeDeckParams {
  limit?: number;
  offset?: number;
  city?: string;
  budget_min?: number;
  budget_max?: number;
}

export interface SwipeDeckResponse {
  profiles: FlatmatesPeer[];
  total: number;
}

export interface SwipeHistoryParams {
  action?: SwipeAction;
  target_type?: SwipeTargetType;
  limit?: number;
  offset?: number;
}

export interface SwipeHistoryItem {
  id: number;
  target_type: SwipeTargetType;
  action: SwipeAction;
  target_user_id?: number;
  property_id?: number;
  did_match?: boolean;
  created_at: string;
}

export interface SwipeHistoryResponse {
  history: SwipeHistoryItem[];
  total: number;
}

export interface VisitFilters {
  status?: VisitStatus;
  context?: VisitContext;
  upcoming?: boolean;
  past?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationFilters {
  type?: string;
  is_read?: boolean;
  limit?: number;
  offset?: number;
}

export interface PeerFilters {
  city?: string;
  budget_min?: number;
  budget_max?: number;
  move_in?: MoveInTimeline;
  limit?: number;
  offset?: number;
}

export interface AdminListingFilters {
  status?: PropertyModerationStatus;
  limit?: number;
  offset?: number;
}

export interface AdminReportFilters {
  status?: ReportStatus;
  limit?: number;
  offset?: number;
}

export interface PropertyImageUploadPayload {
  image_url: string;
  is_main?: boolean;
}

export interface PropertyImageUploadResponse {
  image_url: string;
  is_main: boolean;
}

export interface MatchesResponse {
  matches: MatchSummary[];
  total: number;
}

export interface BoostListingPayload {
  duration: BoostDuration;
}

export interface BoostListingResponse {
  boost_until: string;
  message: string;
}

export interface RenewListingPayload {
  available_from: string;
  expires_at: string;
}

export interface RegisterDevicePayload {
  device_token: string;
  platform?: DevicePlatform;
}

export interface ReportCreate {
  reported_user_id?: number;
  reason: UserReportReason;
  conversation_id?: number | null;
  property_id?: number | null;
  notes?: string;
}

export interface ReportOut {
  id: number;
  reporter_user_id: number;
  reported_user_id: number;
  reason: UserReportReason;
  status: UserReportStatus;
  notes?: string;
  created_at?: string;
}

export interface ProfileViewEventCreate {
  target_user_id: number;
  duration_seconds: number;
  context_property_id?: number;
  scroll_depth_percent?: number;
  source?: string;
}

export interface ProfileViewEventOut {
  id: number;
  viewer_user_id: number;
  viewed_user_id: number;
  context_property_id?: number | null;
  source: string;
  duration_seconds: number;
  scroll_depth_percent?: number | null;
  created_at?: string;
}

export interface ShareCardResponse {
  card_url: string;
  format: ShareCardFormat;
  expires_at?: string;
}

export interface SocietyTagVoteCreate {
  tag: string;
  vote: SocietyTagVoteDirection;
}
