import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsNotificationsPage } from "@/features/settings/pages/SettingsNotificationsPage";

const { save, register, unregister } = vi.hoisted(() => ({
  save: vi.fn(), register: vi.fn(), unregister: vi.fn()
}));
const INITIAL = {
  push_notifications: false,
  email_notifications: true,
  sms_notifications: false,
  promotional_emails: false
};
// The server state: a successful save replaces it, as the real mutation does in the query cache.
let server = { ...INITIAL };
vi.mock("@/features/settings/hooks/useNotificationSettings", () => ({
  useNotificationSettings: () => ({ data: server, isLoading: false, error: null, refetch: vi.fn() }),
  useUpdateNotificationSettings: () => ({ mutateAsync: save })
}));
vi.mock("@/lib/push/fcm", () => ({ requestAndRegisterPush: register, unregisterDevice: unregister }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function toggle(name: string) { fireEvent.click(screen.getByRole("switch", { name })); }
async function advance() { await act(() => vi.advanceTimersByTimeAsync(600)); }

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  server = { ...INITIAL };
  save.mockImplementation(async (changes: Partial<typeof INITIAL>) => {
    server = { ...server, ...changes };
    return server;
  });
  unregister.mockResolvedValue(undefined);
  localStorage.clear();
});
afterEach(() => { vi.useRealTimers(); });

describe("push preference persistence", () => {
  it("saves delayed denial and preserves edits made while permission was pending", async () => {
    const permission = deferred<string | null>();
    register.mockReturnValue(permission.promise);
    render(<MemoryRouter><SettingsNotificationsPage /></MemoryRouter>);
    toggle("Push notifications");
    await advance();
    expect(save).toHaveBeenLastCalledWith({ push_notifications: true });
    toggle("Promotional emails");
    await act(async () => { permission.resolve(null); });
    await advance();
    expect(screen.getByRole("switch", { name: "Push notifications" })).toHaveAttribute("aria-checked", "false");
    // The edit made while permission was pending is kept and sent with the rollback.
    expect(save).toHaveBeenLastCalledWith({ promotional_emails: true, push_notifications: false });
  });

  it("saves denial even when the permission prompt completes after unmount", async () => {
    const permission = deferred<string | null>();
    register.mockReturnValue(permission.promise);
    const { unmount } = render(<MemoryRouter><SettingsNotificationsPage /></MemoryRouter>);
    toggle("Push notifications");
    await advance();
    unmount();
    await act(async () => { permission.resolve(null); });
    expect(save).toHaveBeenLastCalledWith({ push_notifications: false });
  });

  it("ignores an older denial after another enable succeeds", async () => {
    const first = deferred<string | null>();
    register.mockReturnValueOnce(first.promise).mockResolvedValueOnce("new-token");
    render(<MemoryRouter><SettingsNotificationsPage /></MemoryRouter>);
    toggle("Push notifications");
    toggle("Push notifications");
    toggle("Push notifications");
    await act(async () => { first.resolve(null); });
    await advance();
    expect(screen.getByRole("switch", { name: "Push notifications" })).toHaveAttribute("aria-checked", "true");
    expect(save).toHaveBeenLastCalledWith({ push_notifications: true });
  });

  it("unregisters a late enable after the user switched push off", async () => {
    const permission = deferred<string | null>();
    register.mockReturnValue(permission.promise);
    render(<MemoryRouter><SettingsNotificationsPage /></MemoryRouter>);
    toggle("Push notifications");
    toggle("Push notifications");
    await act(async () => { permission.resolve("late-token"); });
    await advance();
    expect(unregister).toHaveBeenCalledWith("late-token");
    expect(save).toHaveBeenLastCalledWith({ push_notifications: false });
  });

  it("orders rollback after an earlier save that is still pending", async () => {
    const permission = deferred<string | null>();
    const firstSave = deferred<unknown>();
    register.mockReturnValue(permission.promise);
    save.mockReturnValueOnce(firstSave.promise);
    render(<MemoryRouter><SettingsNotificationsPage /></MemoryRouter>);
    toggle("Push notifications");
    await advance();
    await act(async () => { permission.resolve(null); });
    await advance();
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => { firstSave.resolve({}); });
    expect(save).toHaveBeenLastCalledWith({ push_notifications: false });
  });
});

describe("failed save", () => {
  it("rolls the toggle back to the server value", async () => {
    save.mockRejectedValue(new Error("boom"));
    render(<MemoryRouter><SettingsNotificationsPage /></MemoryRouter>);
    toggle("Promotional emails");
    expect(screen.getByRole("switch", { name: "Promotional emails" })).toHaveAttribute("aria-checked", "true");
    await advance();
    expect(screen.getByRole("switch", { name: "Promotional emails" })).toHaveAttribute("aria-checked", "false");
  });
});
