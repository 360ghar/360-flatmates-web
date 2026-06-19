import type { CursorPage } from "./common.types";

/** Status of a Razorpay order. Mirrors the lifecycle stages of the payment gateway. */
export type RazorpayOrderStatus =
  | "created"
  | "attempted"
  | "paid"
  | "failed"
  | "cancelled";

/** Request body for creating a Razorpay order for a booking. */
export interface RazorpayOrderRequest {
  booking_id: number;
}

/** Response payload returned by the backend when a Razorpay order is created. */
export interface RazorpayOrderResponse {
  order_id: string;
  amount: number;
  /** Amount in the smallest currency unit (paise for INR). */
  amount_paise: number;
  currency: string;
  receipt?: string;
  status: RazorpayOrderStatus;
  /** Pre-filled key id used by the Razorpay checkout script. */
  key_id: string;
  /** Pre-filled notes (booking id, user id) the gateway echoes back on verify. */
  notes?: Record<string, string>;
  /** Optional human-readable booking label for the checkout receipt. */
  booking_label?: string;
  /** ISO-8601 expiry timestamp for the order, if set by the backend. */
  expires_at?: string;
}

/** Request body for verifying a completed Razorpay payment. */
export interface RazorpayVerifyRequest {
  booking_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Persisted payment method record owned by the current user. */
export interface PaymentMethod {
  id: number;
  /** Brand label (e.g. "Visa", "Mastercard", "UPI"). */
  brand: string;
  /** Last four digits, when applicable (cards). */
  last4?: string;
  /** Tokenized gateway identifier (e.g. Razorpay token id). */
  gateway_token?: string;
  /** UPI/VPA handle when the method is a UPI ID. */
  vpa?: string;
  /** Cardholder name when the method is a card. */
  cardholder_name?: string;
  /** Expiry month (1-12) for cards. */
  exp_month?: number;
  /** Expiry year (4-digit) for cards. */
  exp_year?: number;
  /** True when the method is the default for new charges. */
  is_default: boolean;
  /** Optional nickname supplied by the user. */
  nickname?: string;
  created_at?: string;
  updated_at?: string;
}

/** Payload for creating a new payment method. */
export interface PaymentMethodCreate {
  brand: string;
  last4?: string;
  gateway_token?: string;
  vpa?: string;
  cardholder_name?: string;
  exp_month?: number;
  exp_year?: number;
  is_default?: boolean;
  nickname?: string;
}

/** Payload for updating an existing payment method (PATCH-friendly). */
export interface PaymentMethodUpdate {
  is_default?: boolean;
  nickname?: string;
  exp_month?: number;
  exp_year?: number;
  cardholder_name?: string;
}

/** Envelope of saved payment methods returned by `GET /payments/methods`. */
export type PaymentMethodList = CursorPage<PaymentMethod>;

/** A generic API acknowledgement envelope (matches the backend `MessageResponse`). */
export interface MessageResponse {
  message: string;
}
