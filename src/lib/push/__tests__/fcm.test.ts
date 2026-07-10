import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted so the mock fn is available when vi.mock factory runs
const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiClient: { request: mockRequest },
}));

import {
  requestNotificationPermission,
  getFcmToken,
  registerDevice,
  unregisterDevice,
  requestAndRegisterPush,
} from "../fcm";

describe("fcm push utilities", () => {
  // ─── requestNotificationPermission ────────────────────────────

  describe("requestNotificationPermission", () => {
    let originalNotification: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalNotification = Object.getOwnPropertyDescriptor(globalThis, "Notification");
    });

    afterEach(() => {
      // Restore original Notification
      if (originalNotification) {
        Object.defineProperty(globalThis, "Notification", originalNotification);
      } else {
        // @ts-expect-error -- deleting from globalThis
        delete globalThis.Notification;
      }
    });

    it('returns "denied" when Notification API is not available', async () => {
      // Remove Notification from globalThis
      // @ts-expect-error -- deleting from globalThis
      delete globalThis.Notification;
      const result = await requestNotificationPermission();
      expect(result).toBe("denied");
    });

    it('returns "granted" when permission is already granted', async () => {
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "granted", requestPermission: vi.fn() },
        writable: true,
        configurable: true,
      });
      const result = await requestNotificationPermission();
      expect(result).toBe("granted");
    });

    it('returns "denied" when permission is already denied', async () => {
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "denied", requestPermission: vi.fn() },
        writable: true,
        configurable: true,
      });
      const result = await requestNotificationPermission();
      expect(result).toBe("denied");
    });

    it("calls requestPermission when permission is default", async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue("granted");
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "default", requestPermission: mockRequestPermission },
        writable: true,
        configurable: true,
      });
      const result = await requestNotificationPermission();
      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
      expect(result).toBe("granted");
    });

    it('returns "denied" when user denies permission', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue("denied");
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "default", requestPermission: mockRequestPermission },
        writable: true,
        configurable: true,
      });
      const result = await requestNotificationPermission();
      expect(result).toBe("denied");
    });
  });

  // ─── getFcmToken ──────────────────────────────────────────────

  describe("getFcmToken", () => {
    let originalServiceWorker: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
      vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "test-vapid-key");
    });

    afterEach(() => {
      if (originalServiceWorker) {
        Object.defineProperty(navigator, "serviceWorker", originalServiceWorker);
      }
      vi.unstubAllEnvs();
    });

    it("returns null when serviceWorker is not available", async () => {
      // Remove serviceWorker from navigator
      Object.defineProperty(navigator, "serviceWorker", {
        value: undefined,
        configurable: true,
      });
      const result = await getFcmToken();
      expect(result).toBeNull();
    });

    it("returns null when VAPID key is not set", async () => {
      vi.stubEnv("VITE_VAPID_PUBLIC_KEY", undefined);
      Object.defineProperty(navigator, "serviceWorker", {
        value: { ready: Promise.resolve({ pushManager: { getSubscription: vi.fn() } }) },
        configurable: true,
      });
      const result = await getFcmToken();
      expect(result).toBeNull();
    });

    it("returns existing subscription endpoint if already subscribed", async () => {
      const existingSubscription = { endpoint: "https://push.example.com/existing" };
      const mockGetSubscription = vi.fn().mockResolvedValue(existingSubscription);
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: { getSubscription: mockGetSubscription, subscribe: vi.fn() },
          }),
        },
        configurable: true,
      });
      const result = await getFcmToken();
      expect(result).toBe("https://push.example.com/existing");
      expect(mockGetSubscription).toHaveBeenCalledTimes(1);
    });

    it("subscribes and returns endpoint when no existing subscription", async () => {
      const newSubscription = { endpoint: "https://push.example.com/new" };
      const mockGetSubscription = vi.fn().mockResolvedValue(null);
      const mockSubscribe = vi.fn().mockResolvedValue(newSubscription);
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: { getSubscription: mockGetSubscription, subscribe: mockSubscribe },
          }),
        },
        configurable: true,
      });
      const result = await getFcmToken();
      expect(result).toBe("https://push.example.com/new");
      expect(mockSubscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: "test-vapid-key",
      });
    });

    it("returns null when push subscription fails", async () => {
      const mockGetSubscription = vi.fn().mockRejectedValue(new Error("Push error"));
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: { getSubscription: mockGetSubscription, subscribe: vi.fn() },
          }),
        },
        configurable: true,
      });
      const result = await getFcmToken();
      expect(result).toBeNull();
    });
  });

  // ─── registerDevice ───────────────────────────────────────────

  describe("registerDevice", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("calls apiClient.request with correct payload", async () => {
      mockRequest.mockResolvedValue(undefined);
      await registerDevice("test-token-123");
      expect(mockRequest).toHaveBeenCalledWith({
        method: "POST",
        path: "/notifications/devices/register",
        body: { token: "test-token-123", platform: "web" },
      });
    });

    it("propagates errors from apiClient", async () => {
      mockRequest.mockRejectedValue(new Error("Network error"));
      await expect(registerDevice("test-token")).rejects.toThrow("Network error");
    });
  });

  // ─── unregisterDevice ─────────────────────────────────────────

  describe("unregisterDevice", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("calls apiClient.request with correct payload", async () => {
      mockRequest.mockResolvedValue(undefined);
      await unregisterDevice("test-token-456");
      expect(mockRequest).toHaveBeenCalledWith({
        method: "DELETE",
        path: "/notifications/devices/unregister",
        query: { token: "test-token-456" },
      });
    });

    it("propagates errors from apiClient", async () => {
      mockRequest.mockRejectedValue(new Error("Server error"));
      await expect(unregisterDevice("test-token")).rejects.toThrow("Server error");
    });
  });

  // ─── requestAndRegisterPush ───────────────────────────────────

  describe("requestAndRegisterPush", () => {
    let originalNotification: PropertyDescriptor | undefined;

    beforeEach(() => {
      vi.clearAllMocks();
      originalNotification = Object.getOwnPropertyDescriptor(globalThis, "Notification");
      vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "test-vapid-key");
    });

    afterEach(() => {
      if (originalNotification) {
        Object.defineProperty(globalThis, "Notification", originalNotification);
      } else {
        // @ts-expect-error -- deleting from globalThis
        delete globalThis.Notification;
      }
      vi.unstubAllEnvs();
      // Restore serviceWorker
      const originalSW = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
      if (!originalSW) {
        Object.defineProperty(navigator, "serviceWorker", {
          value: undefined,
          configurable: true,
        });
      }
    });

    it("returns null when notification permission is denied", async () => {
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "denied", requestPermission: vi.fn() },
        writable: true,
        configurable: true,
      });
      const result = await requestAndRegisterPush();
      expect(result).toBeNull();
    });

    it("returns null when FCM token cannot be obtained", async () => {
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "granted", requestPermission: vi.fn() },
        writable: true,
        configurable: true,
      });
      // serviceWorker not available -> getFcmToken returns null
      Object.defineProperty(navigator, "serviceWorker", {
        value: undefined,
        configurable: true,
      });
      const result = await requestAndRegisterPush();
      expect(result).toBeNull();
    });

    it("returns null when device registration fails", async () => {
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "granted", requestPermission: vi.fn() },
        writable: true,
        configurable: true,
      });
      const mockGetSubscription = vi.fn().mockResolvedValue({
        endpoint: "https://push.example.com/token",
      });
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: { getSubscription: mockGetSubscription, subscribe: vi.fn() },
          }),
        },
        configurable: true,
      });
      mockRequest.mockRejectedValue(new Error("Registration failed"));
      const result = await requestAndRegisterPush();
      expect(result).toBeNull();
    });

    it("returns the token on full success", async () => {
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "granted", requestPermission: vi.fn() },
        writable: true,
        configurable: true,
      });
      const mockGetSubscription = vi.fn().mockResolvedValue({
        endpoint: "https://push.example.com/success-token",
      });
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: { getSubscription: mockGetSubscription, subscribe: vi.fn() },
          }),
        },
        configurable: true,
      });
      mockRequest.mockResolvedValue(undefined);
      const result = await requestAndRegisterPush();
      expect(result).toBe("https://push.example.com/success-token");
      expect(mockRequest).toHaveBeenCalledWith({
        method: "POST",
        path: "/notifications/devices/register",
        body: { token: "https://push.example.com/success-token", platform: "web" },
      });
    });

    it("requests permission when default and proceeds if granted", async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue("granted");
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "default", requestPermission: mockRequestPermission },
        writable: true,
        configurable: true,
      });
      const mockGetSubscription = vi.fn().mockResolvedValue({
        endpoint: "https://push.example.com/new-token",
      });
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: { getSubscription: mockGetSubscription, subscribe: vi.fn() },
          }),
        },
        configurable: true,
      });
      mockRequest.mockResolvedValue(undefined);
      const result = await requestAndRegisterPush();
      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
      expect(result).toBe("https://push.example.com/new-token");
    });
  });
});
