/** localStorage key for this browser's registered FCM token. */
export const PUSH_TOKEN_KEY = "flatmates_web_push_token";

export function readPushToken(): string | null {
  try {
    return localStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}
