import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  usePaymentMethods,
  useRazorpayCreateOrder,
  useRazorpayVerifyPayment,
  useAddPaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useBatchRemoveSwipes,
  useBatchDeleteMedia
} from "@/hooks/queries";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("Payment & batch hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("usePaymentMethods", () => {
    it("uses query key ['payments', 'methods']", async () => {
      const mockMethods = [
        {
          id: 1,
          brand: "Visa",
          last4: "1234",
          is_default: true
        }
      ];
      mockRequest.mockResolvedValue({
        items: mockMethods,
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => usePaymentMethods(), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["payments", "methods"]);
      expect(cache).toEqual(mockMethods);
    });

    it("requests GET /payments/methods", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      renderHook(() => usePaymentMethods(), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/payments/methods");
    });
  });

  describe("useRazorpayCreateOrder", () => {
    it("sends POST /payments/razorpay/order", async () => {
      mockRequest.mockResolvedValue({
        order_id: "order_abc",
        amount: 15000,
        amount_paise: 1500000,
        currency: "INR",
        status: "created",
        key_id: "rzp_test"
      });

      const { result } = renderHook(() => useRazorpayCreateOrder(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ booking_id: 42 });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/payments/razorpay/order");
      expect(call.body).toEqual({ booking_id: 42 });
    });
  });

  describe("useRazorpayVerifyPayment", () => {
    it("sends POST /payments/razorpay/verify", async () => {
      mockRequest.mockResolvedValue({ message: "Payment verified" });

      const { result } = renderHook(() => useRazorpayVerifyPayment(), {
        wrapper: createWrapper()
      });

      result.current.mutate({
        booking_id: 42,
        razorpay_order_id: "order_abc",
        razorpay_payment_id: "pay_xyz",
        razorpay_signature: "sig"
      });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/payments/razorpay/verify");
      expect(call.body).toEqual({
        booking_id: 42,
        razorpay_order_id: "order_abc",
        razorpay_payment_id: "pay_xyz",
        razorpay_signature: "sig"
      });
    });
  });

  describe("useAddPaymentMethod", () => {
    it("sends POST /payments/methods and invalidates ['payments', 'methods'] on success", async () => {
      mockRequest.mockResolvedValue({
        id: 7,
        brand: "UPI",
        vpa: "name@bank",
        is_default: false
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHook(() => useAddPaymentMethod(), { wrapper });

      result.current.mutate({ brand: "UPI", vpa: "name@bank" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["payments", "methods"]
      });
    });
  });

  describe("useUpdatePaymentMethod", () => {
    it("sends PUT /payments/methods/{id}", async () => {
      mockRequest.mockResolvedValue({
        id: 7,
        brand: "UPI",
        vpa: "name@bank",
        is_default: true
      });

      const { result } = renderHook(() => useUpdatePaymentMethod(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 7, payload: { is_default: true } });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("PUT");
      expect(call.path).toBe("/payments/methods/7");
      expect(call.body).toEqual({ is_default: true });
    });
  });

  describe("useDeletePaymentMethod", () => {
    it("sends DELETE /payments/methods/{id}", async () => {
      mockRequest.mockResolvedValue({ message: "Removed" });

      const { result } = renderHook(() => useDeletePaymentMethod(), {
        wrapper: createWrapper()
      });

      result.current.mutate(7);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("DELETE");
      expect(call.path).toBe("/payments/methods/7");
    });
  });

  describe("useBatchRemoveSwipes", () => {
    it("sends POST /swipes/batch-remove", async () => {
      mockRequest.mockResolvedValue({
        removed_count: 2,
        failed_property_ids: [],
        message: "Removed 2 swipes"
      });

      const { result } = renderHook(() => useBatchRemoveSwipes(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ property_ids: [101, 102] });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/swipes/batch-remove");
      expect(call.body).toEqual({ property_ids: [101, 102] });
    });
  });

  describe("useBatchDeleteMedia", () => {
    it("sends POST /upload/media/batch-delete", async () => {
      mockRequest.mockResolvedValue({
        deleted: ["media1", "media2"],
        failed: []
      });

      const { result } = renderHook(() => useBatchDeleteMedia(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ media_ids: ["media1", "media2"] });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/upload/media/batch-delete");
      expect(call.body).toEqual({ media_ids: ["media1", "media2"] });
    });
  });
});
