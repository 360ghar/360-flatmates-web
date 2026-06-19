import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  MessageResponse,
  PaymentMethod,
  PaymentMethodCreate,
  PaymentMethodCursorPage,
  PaymentMethodUpdate,
  PaymentMethodList,
  RazorpayOrderRequest,
  RazorpayOrderResponse,
  RazorpayVerifyRequest
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

/**
 * Local fallback alias — if the backend lists the payment methods as a flat
 * `PaymentMethod[]` rather than a cursor envelope, the query selector still
 * produces a stable list. The backend's `GET /payments/methods` returns the
 * `PaymentMethodList` (cursor page), so this is the primary shape.
 */
type PaymentMethodCursorPageAlias = PaymentMethodList | PaymentMethod[];

function normalizePaymentMethods(
  response: PaymentMethodCursorPageAlias
): PaymentMethod[] {
  if (Array.isArray(response)) return response;
  return response.items;
}

export function paymentMethodsOptions() {
  return queryOptions({
    queryKey: ["payments", "methods"],
    queryFn: async () => {
      const response = await apiClient.request<PaymentMethodCursorPageAlias>({
        method: "GET",
        path: "/payments/methods"
      });
      return normalizePaymentMethods(response);
    },
    staleTime: 60_000
  });
}

export function usePaymentMethods() {
  return useQuery(paymentMethodsOptions());
}

export function useRazorpayCreateOrder() {
  return useMutation({
    mutationFn: (payload: RazorpayOrderRequest) =>
      apiClient.request<RazorpayOrderResponse>({
        method: "POST",
        path: "/payments/razorpay/order",
        body: payload
      })
  });
}

export function useRazorpayVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RazorpayVerifyRequest) =>
      apiClient.request<MessageResponse>({
        method: "POST",
        path: "/payments/razorpay/verify",
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    }
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentMethodCreate) =>
      apiClient.request<PaymentMethod>({
        method: "POST",
        path: "/payments/methods",
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "methods"] });
    }
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation<PaymentMethod, Error, { id: number; payload: PaymentMethodUpdate }>({
    mutationFn: ({ id, payload }) =>
      apiClient.request<PaymentMethod>({
        method: "PUT",
        path: `/payments/methods/${id}`,
        body: payload
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<PaymentMethod[]>(
        ["payments", "methods"],
        (old) => (old ?? []).map((m) => (m.id === updated.id ? updated : m))
      );
    }
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (methodId: number) =>
      apiClient.request<MessageResponse>({
        method: "DELETE",
        path: `/payments/methods/${methodId}`
      }),
    onSuccess: (_data, methodId) => {
      queryClient.setQueryData<PaymentMethod[]>(
        ["payments", "methods"],
        (old) => (old ?? []).filter((m) => m.id !== methodId)
      );
    }
  });
}

export interface RazorpayCheckoutOptions {
  /** Server-issued order id, amount, currency, key_id etc. */
  order: RazorpayOrderResponse;
  /** Pre-filled customer details when available. */
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  /** Called by Razorpay on successful payment. */
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  /** Called when the user dismisses the checkout modal. */
  onDismiss?: () => void;
}

/**
 * Programmatic Razorpay checkout launcher.
 *
 * Loads the gateway script lazily (idempotent), opens the modal, and resolves
 * with the gateway payload. Network failures and dismissals are surfaced via
 * the callbacks. The component is intentionally framework-agnostic so any
 * page (PaymentsPage, booking confirm modal, etc.) can re-use it.
 */
export function useRazorpayCheckout() {
  return useMutation({
    mutationFn: async ({
      order,
      prefill,
      onSuccess,
      onDismiss
    }: RazorpayCheckoutOptions) => {
      if (typeof window === "undefined") {
        throw new Error("Razorpay checkout requires a browser environment");
      }
      // Lazily load the gateway script — keeps the initial bundle small for
      // pages that never trigger a payment.
      await loadRazorpayScript();
      const RazorpayCtor = (window as unknown as {
        Razorpay?: new (options: unknown) => { open: () => void; on: (event: string, cb: (resp: unknown) => void) => void };
      }).Razorpay;
      if (!RazorpayCtor) {
        throw new Error("Razorpay SDK failed to load");
      }
      const checkout = new RazorpayCtor({
        key: order.key_id,
        amount: order.amount_paise,
        currency: order.currency,
        name: "360 Ghar",
        description: order.booking_label ?? "Booking payment",
        order_id: order.order_id,
        prefill,
        notes: order.notes,
        handler: (resp: unknown) => {
          const payload = resp as {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          };
          onSuccess(payload);
        },
        modal: {
          ondismiss: () => {
            onDismiss?.();
          }
        }
      });
      checkout.open();
      return { launched: true as const };
    }
  });
}

let _razorpayScriptPromise: Promise<void> | null = null;
function loadRazorpayScript(): Promise<void> {
  if (_razorpayScriptPromise) return _razorpayScriptPromise;
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Cannot load Razorpay outside the browser"));
  }
  _razorpayScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-razorpay="1"]'
    );
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Razorpay script failed to load")),
        { once: true }
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "1";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => {
      _razorpayScriptPromise = null;
      reject(new Error("Razorpay script failed to load"));
    };
    document.head.appendChild(script);
  });
  return _razorpayScriptPromise;
}

export { loadRazorpayScript as _loadRazorpayScriptForTests };

// Suppress unused import warning when PaymentMethodCursorPage is not directly
// referenced — the runtime shape is provided by the response type alias.
export type { PaymentMethodCursorPage };
