import { PUSH_TOKEN_KEY } from "@/lib/push/token";
import { Page, PageHeader } from "@/components/ui/Layout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUpdateProfile, useMyProfile } from "@/hooks/queries/useProfiles";
import { uiStore } from "@/lib/stores/ui-store";
import {
  requestAndRegisterPush,
  unregisterDevice
} from "@/lib/push/fcm";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { InlineError } from "@/components/ui/StateViews";
import { Toggle } from "@/components/ui/Toggle";

interface NotificationToggle {
  key: string;
  label: string;
  defaultOn: boolean;
}

const NOTIFICATION_TOGGLES: NotificationToggle[] = [
  { key: "push_notifications", label: "Push notifications", defaultOn: true },
  { key: "new_matches", label: "New matches", defaultOn: true },
  { key: "messages", label: "Messages", defaultOn: true },
  { key: "visit_reminders", label: "Visit reminders", defaultOn: true },
  { key: "listing_updates", label: "Listing updates", defaultOn: true },
  { key: "promotional", label: "Promotional", defaultOn: false },
  { key: "quiet_hours", label: "Quiet hours 10 PM to 8 AM", defaultOn: false }
];

// TODO(typing): preferences is currently typed as Record<string, boolean> which
// means the wire contract is unverified. Replace with a proper schema once the
// backend finalises the notification-preferences wire (B-* items in the audit).

function buildInitialToggles(savedPrefs: Record<string, boolean>): Record<string, boolean> {
  const initial: Record<string, boolean> = {};
  for (const t of NOTIFICATION_TOGGLES) {
    initial[t.key] = savedPrefs[t.key] ?? t.defaultOn;
  }
  return initial;
}

export function SettingsNotificationsPage() {
  const { data: profile, isLoading, error, refetch } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPrefs = useRef<Record<string, boolean> | null>(null);

  const savedPrefs = useMemo(
    () => (profile?.preferences as Record<string, boolean> | undefined) ?? {},
    [profile?.preferences]
  );

  const [userEdits, setUserEdits] = useState<Record<string, boolean> | null>(null);
  const baseToggles = useMemo(() => buildInitialToggles(savedPrefs), [savedPrefs]);
  const toggles = userEdits ?? baseToggles;

  const latestPrefs = useRef<Record<string, boolean> | null>(null);
  const mounted = useRef(false);
  const pushAttempt = useRef(0);
  const pendingWrites = useRef<Promise<void>>(Promise.resolve());
  const updateProfileRef = useRef(updateProfile);
  useEffect(() => {
    updateProfileRef.current = updateProfile;
  });

  const flushPrefs = useCallback(() => {
    const preferences = pendingPrefs.current;
    if (!preferences) return;
    pendingPrefs.current = null;
    // Preserve write order: a slow opt-in save must not overwrite its rollback.
    pendingWrites.current = pendingWrites.current
      .then(() => updateProfileRef.current.mutateAsync({ preferences }))
      .then(() => {
        if (mounted.current) {
          uiStore.getState().pushToast({ type: "success", title: "Notification preferences saved" });
        }
      })
      .catch(() => {
        uiStore.getState().pushToast({
          type: "error",
          title: "Could not save preferences",
          description: "Please reopen settings to retry."
        });
      });
  }, []);

  const queuePreferences = useCallback((next: Record<string, boolean>) => {
    latestPrefs.current = next;
    pendingPrefs.current = next;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (mounted.current) {
      setUserEdits(next);
      debounceRef.current = setTimeout(flushPrefs, 500);
    } else {
      // A permission prompt can finish after navigating away from settings.
      flushPrefs();
    }
  }, [flushPrefs]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      flushPrefs();
    };
  }, [flushPrefs]);

  const handleToggle = useCallback(
    (key: string) => {
      const base = latestPrefs.current ?? baseToggles;
      const wasOn = base[key] ?? false;
      const next = { ...base, [key]: !base[key] };

      queuePreferences(next);

      // Opt-in browser push: register/unregister when the master toggle flips.
      if (key === "push_notifications") {
        const enabling = !wasOn;
        const attempt = ++pushAttempt.current;
        void (async () => {
          try {
            if (enabling) {
              const token = await requestAndRegisterPush();
              if (attempt !== pushAttempt.current) {
                if (token && !latestPrefs.current?.push_notifications) {
                  await unregisterDevice(token);
                }
                return;
              }
              if (!token) {
                // Permission denied or unsupported: put the toggle back off
                // so the saved preference matches reality.
                queuePreferences({
                  ...latestPrefs.current,
                  push_notifications: false
                });
                uiStore.getState().pushToast({
                  type: "info",
                  title: "Push not enabled",
                  description: "Allow notifications for this site in your browser settings, then try again."
                });
                return;
              }
              try {
                localStorage.setItem(PUSH_TOKEN_KEY, token);
              } catch {
                /* private mode / quota — registration still succeeded */
              }
              uiStore.getState().pushToast({
                type: "success",
                title: "Push notifications enabled"
              });
            } else {
              let token: string | null = null;
              try {
                token = localStorage.getItem(PUSH_TOKEN_KEY);
              } catch {
                token = null;
              }
              if (token) {
                await unregisterDevice(token);
                try {
                  if (attempt === pushAttempt.current) localStorage.removeItem(PUSH_TOKEN_KEY);
                } catch {
                  /* ignore */
                }
              }
            }
          } catch {
            if (attempt !== pushAttempt.current) return;
            if (enabling) {
              queuePreferences({ ...latestPrefs.current, push_notifications: false });
            }
            uiStore.getState().pushToast({
              type: "error",
              title: "Could not update push registration",
              description: "Preferences were saved; try again later for device sync."
            });
          }
        })();
      }
    },
    [baseToggles, queuePreferences]
  );

  if (isLoading) {
    return (
      <Page width="narrow">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-cut-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="rounded-hand bg-surface paper-grain shadow-sm">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex min-h-14 items-center justify-between border-b border-line px-4 py-3 last:border-b-0"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </Page>
    );
  }

  return (
    <Page width="narrow">
      <PageHeader title="Notification settings" />

      {error ? (
        <InlineError
            title="Could not load preferences"
            description="Please try again."
            onRetry={() => refetch()} />
      ) : (
        <Card className="divide-y divide-line p-0">
          {NOTIFICATION_TOGGLES.map((item) => (
            <div
              key={item.key}
              className="flex min-h-14 items-center justify-between px-4 py-3"
            >
              <span id={`toggle-label-${item.key}`} className="text-body-md font-medium text-ink">{item.label}</span>
              <Toggle
                checked={toggles[item.key]}
                onCheckedChange={() => handleToggle(item.key)}
                aria-labelledby={`toggle-label-${item.key}`}
              />
            </div>
          ))}
        </Card>
      )}
    </Page>
  );
}
