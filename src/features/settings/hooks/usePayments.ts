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
  // Defense-in-depth against envelope shape drift (see RCA for the
  // notifications `h?.filter is not a function` regression).
  return Array.isArray(response?.items) ? response.items : [];
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

// Suppress unused import warning when PaymentMethodCursorPage is not directly
// referenced — the runtime shape is provided by the response type alias.
export type { PaymentMethodCursorPage };
