import { apiClient } from "@/lib/api";
import { getEnv } from "@/lib/env";
import type { RegisterDevicePayload } from "@/lib/api/types";

/**
 * Request browser notification permission via the Notification API.
 * Returns the current permission state after the prompt.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
}

/**
 * Get an FCM registration token using the Web Push API (PushManager).
 *
 * This uses the standard Push API subscription flow rather than the
 * firebase/messaging SDK, so no Firebase dependency is required.
 * The applicationServerKey (VAPID key) must be configured via env.
 *
 * Returns the subscription endpoint or encrypted keys as a serialized
 * token string, or null if the subscription fails.
 */
export async function getFcmToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const vapidKey = getEnv().VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn("[fcm] VITE_VAPID_PUBLIC_KEY is not set; push registration skipped");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });
    }

    // Serialize the PushSubscription to a token the backend can store.
    // The endpoint URL uniquely identifies this browser subscription.
    const token = subscription.endpoint;
    return token;
  } catch (error) {
    console.error("[fcm] Push subscription failed:", error);
    return null;
  }
}

/**
 * Register the current device token with the backend.
 * Calls POST /notifications/devices/register with `{ token, platform }`.
 */
export async function registerDevice(token: string): Promise<void> {
  const payload: RegisterDevicePayload = {
    token,
    platform: "web"
  };

  await apiClient.request({
    method: "POST",
    path: "/notifications/devices/register",
    body: payload
  });
}

/**
 * Unregister a device token from the backend.
 * Calls DELETE /notifications/devices/unregister?token=...
 */
export async function unregisterDevice(token: string): Promise<void> {
  await apiClient.request({
    method: "DELETE",
    path: "/notifications/devices/unregister",
    query: { token }
  });
}

/**
 * Convenience: request permission, get token, and register with backend
 * in a single call. Returns the token on success or null on failure.
 */
export async function requestAndRegisterPush(): Promise<string | null> {
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    return null;
  }

  const token = await getFcmToken();
  if (!token) {
    return null;
  }

  try {
    await registerDevice(token);
    return token;
  } catch (error) {
    console.error("[fcm] Device registration failed:", error);
    return null;
  }
}
