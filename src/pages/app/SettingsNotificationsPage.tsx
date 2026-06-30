import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useUpdateProfile, useMyProfile } from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
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
  const navigate = useNavigate();
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

  const flushPrefs = useCallback(() => {
    if (pendingPrefs.current) {
      updateProfile.mutate(
        { preferences: pendingPrefs.current },
        {
          onSuccess: () => {
            uiStore.getState().pushToast({
              type: "success",
              title: "Notification preferences saved"
            });
          },
          onError: () => {
            uiStore.getState().pushToast({
              type: "error",
              title: "Could not save preferences",
              description: "Please try again."
            });
          }
        }
      );
      pendingPrefs.current = null;
    }
  }, [updateProfile]);

  // Flush any pending preferences on unmount. Best-effort: the user has
  // already navigated away, so we still attempt the save but log an error
  // toast if it fails.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (pendingPrefs.current) {
        updateProfile.mutate(
          { preferences: pendingPrefs.current },
          {
            onError: () => {
              uiStore.getState().pushToast({
                type: "error",
                title: "Could not save preferences",
                description: "Please reopen settings to retry."
              });
            }
          }
        );
        pendingPrefs.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = useCallback(
    (key: string) => {
      setUserEdits((prev) => {
        const base = prev ?? baseToggles;
        const next = { ...base, [key]: !base[key] };
        pendingPrefs.current = next;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(flushPrefs, 500);

        return next;
      });
    },
    [baseToggles, flushPrefs]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 page-fade">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-[9px]" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="rounded-2xl border border-line bg-surface">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex min-h-14 items-center justify-between px-4 py-3 border-b border-line last:border-b-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          aria-label="Back to profile"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Notification Settings</h1>
      </div>

      {error ? (
        <Card className="flex items-center justify-center p-8">
          <ErrorState
            title="Could not load preferences"
            description="Please try again."
            onRetry={() => refetch()}
          />
        </Card>
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
    </div>
  );
}
