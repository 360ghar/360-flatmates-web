import { PUSH_TOKEN_KEY } from "@/lib/push/token";
import { Page, PageHeader } from "@/components/ui/Layout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  type NotificationSettingKey
} from "@/features/settings/hooks/useNotificationSettings";
import { uiStore } from "@/lib/stores/ui-store";
import {
  requestAndRegisterPush,
  unregisterDevice
} from "@/lib/push/fcm";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { InlineError } from "@/components/ui/StateViews";
import { Toggle } from "@/components/ui/Toggle";

/** The four notification settings the backend knows: nothing else is stored or read. */
const NOTIFICATION_TOGGLES: ReadonlyArray<{ key: NotificationSettingKey; label: string }> = [
  { key: "push_notifications", label: "Push notifications" },
  { key: "email_notifications", label: "Email notifications" },
  { key: "sms_notifications", label: "Text messages" },
  { key: "promotional_emails", label: "Promotional emails" }
];

type Settings = Record<NotificationSettingKey, boolean>;

export function SettingsNotificationsPage() {
  const { data: saved, isLoading, error, refetch } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keys changed since the last save. A save sends only these.
  const pendingChanges = useRef<Partial<Settings>>({});

  const [userEdits, setUserEdits] = useState<Partial<Settings>>({});
  const baseToggles = useMemo<Settings | null>(
    () =>
      saved
        ? {
            push_notifications: saved.push_notifications,
            email_notifications: saved.email_notifications,
            sms_notifications: saved.sms_notifications,
            promotional_emails: saved.promotional_emails
          }
        : null,
    [saved]
  );
  const toggles = useMemo<Settings | null>(
    () => (baseToggles ? { ...baseToggles, ...userEdits } : null),
    [baseToggles, userEdits]
  );

  // The server value plus every edit not yet confirmed. Refs, so a quick second click reads
  // the first one before React re-renders, and a refetch moves the base.
  const baseRef = useRef<Settings | null>(null);
  const userEditsRef = useRef<Partial<Settings>>({});
  useEffect(() => {
    baseRef.current = baseToggles;
  }, [baseToggles]);
  const currentToggles = useCallback(
    (): Settings | null => (baseRef.current ? { ...baseRef.current, ...userEditsRef.current } : null),
    []
  );
  /** A save ended: forget its keys (a success is now the server value, a failure rolls back to it),
   *  except keys edited again since. */
  const settleEdits = useCallback((sent: Partial<Settings>) => {
    const next = { ...userEditsRef.current };
    for (const key of Object.keys(sent) as NotificationSettingKey[]) {
      if (!(key in pendingChanges.current) && next[key] === sent[key]) delete next[key];
    }
    userEditsRef.current = next;
    setUserEdits(next);
  }, []);
  const mounted = useRef(false);
  const pushAttempt = useRef(0);
  const pendingWrites = useRef<Promise<void>>(Promise.resolve());
  const updateSettingsRef = useRef(updateSettings);
  useEffect(() => {
    updateSettingsRef.current = updateSettings;
  });

  const flushChanges = useCallback(() => {
    const changes = pendingChanges.current;
    if (Object.keys(changes).length === 0) return;
    pendingChanges.current = {};
    // Preserve write order: a slow opt-in save must not overwrite its rollback.
    pendingWrites.current = pendingWrites.current
      .then(() => updateSettingsRef.current.mutateAsync(changes))
      .then(() => {
        settleEdits(changes);
        if (mounted.current) {
          uiStore.getState().pushToast({ type: "success", title: "Notification settings saved" });
        }
      })
      .catch(() => {
        // The toggles go back to the server value, so the screen does not claim a save that failed.
        settleEdits(changes);
        uiStore.getState().pushToast({
          type: "error",
          title: "Could not save settings",
          description: "The change was not saved. Try again."
        });
      });
  }, [settleEdits]);

  const queueChanges = useCallback((changes: Partial<Settings>) => {
    userEditsRef.current = { ...userEditsRef.current, ...changes };
    pendingChanges.current = { ...pendingChanges.current, ...changes };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (mounted.current) {
      setUserEdits(userEditsRef.current);
      debounceRef.current = setTimeout(flushChanges, 500);
    } else {
      // A permission prompt can finish after navigating away from settings.
      flushChanges();
    }
  }, [flushChanges]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      flushChanges();
    };
  }, [flushChanges]);

  const handleToggle = useCallback(
    (key: NotificationSettingKey) => {
      const base = currentToggles();
      if (!base) return;
      const wasOn = base[key];

      queueChanges({ [key]: !wasOn });

      // Opt-in browser push: register/unregister when the master toggle flips.
      if (key === "push_notifications") {
        const enabling = !wasOn;
        const attempt = ++pushAttempt.current;
        void (async () => {
          try {
            if (enabling) {
              const token = await requestAndRegisterPush();
              if (attempt !== pushAttempt.current) {
                if (token && !currentToggles()?.push_notifications) {
                  await unregisterDevice(token);
                }
                return;
              }
              if (!token) {
                // Permission denied or unsupported: put the toggle back off
                // so the saved preference matches reality.
                queueChanges({ push_notifications: false });
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
              queueChanges({ push_notifications: false });
            }
            uiStore.getState().pushToast({
              type: "error",
              title: "Could not update push registration",
              description: "Settings were saved; try again later for device sync."
            });
          }
        })();
      }
    },
    [currentToggles, queueChanges]
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

      {error || !toggles ? (
        <InlineError
            title="Could not load settings"
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
