import type {
  Cleanliness,
  FlatmatesMode,
  FlatmatesProfileStatus,
  FoodHabits,
  GenderPreference,
  GuestsPolicy,
  MoveInTimeline,
  NonNegotiable,
  SleepSchedule,
  SmokingDrinking,
  SocietyTagVoteDirection,
  UserReportReason,
  UserReportStatus,
  UserRole,
  WorkStyle
} from "@/lib/data";
import type { JsonObject } from "./common.types";

export interface User {
  id: number;
  email?: string;
  phone?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  created_at?: string;
  preferences?: JsonObject;
  /** Whether the user's email has been confirmed (Supabase email_confirmed_at). */
  email_verified?: boolean;
  /** Whether the user's phone has been confirmed. */
  phone_verified?: boolean;
  /** Last auth method the user successfully used. */
  last_auth_method?:
    | "google"
    | "email_password"
    | "phone_password"
    | "phone_otp"
    | "email_otp";
}

export interface UserLocation {
  city?: string;
  locality?: string;
  lat?: number;
  lng?: number;
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
  Omit<FlatmatesProfile, "id" | "last_active_at">
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
  catalogs: import("./common.types").CatalogEntry[];
  active_listing_count: number;
  conversation_count: number;
  unread_message_count: number;
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

export interface PeerFilters {
  city?: string;
  budget_min?: number;
  budget_max?: number;
  move_in?: MoveInTimeline;
  limit?: number;
  offset?: number;
}

export interface SocietyTagVoteCreate {
  tag: string;
  vote: SocietyTagVoteDirection;
}
