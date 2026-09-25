import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsNotificationsPage } from "./SettingsNotificationsPage";

const { save, register, unregister } = vi.hoisted(() => ({
  save: vi.fn(), register: vi.fn(), unregister: vi.fn()
}));
vi.mock("@/hooks/queries", () => ({
  useMyProfile: () => ({ data: { preferences: { push_notifications: false } } }),
  useUpdateProfile: () => ({ mutateAsync: save })
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
  save.mockResolvedValue({});
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
    expect(save).toHaveBeenLastCalledWith({ preferences: expect.objectContaining({ push_notifications: true }) });
    toggle("New matches");
    await act(async () => { permission.resolve(null); });
    await advance();
    expect(screen.getByRole("switch", { name: "Push notifications" })).toHaveAttribute("aria-checked", "false");
    expect(save).toHaveBeenLastCalledWith({ preferences: expect.objectContaining({ push_notifications: false, new_matches: false }) });
  });

  it("saves denial even when the permission prompt completes after unmount", async () => {
    const permission = deferred<string | null>();
    register.mockReturnValue(permission.promise);
    const { unmount } = render(<MemoryRouter><SettingsNotificationsPage /></MemoryRouter>);
    toggle("Push notifications");
    await advance();
    unmount();
    await act(async () => { permission.resolve(null); });
    expect(save).toHaveBeenLastCalledWith({ preferences: expect.objectContaining({ push_notifications: false }) });
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
    expect(save).toHaveBeenLastCalledWith({ preferences: expect.objectContaining({ push_notifications: true }) });
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
    expect(save).toHaveBeenLastCalledWith({ preferences: expect.objectContaining({ push_notifications: false }) });
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
    expect(save).toHaveBeenLastCalledWith({ preferences: expect.objectContaining({ push_notifications: false }) });
  });
});
