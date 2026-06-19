import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test-utils";
import { AppShell, type ShellUser } from "../AppShell";

const mockUser: ShellUser = {
  name: "Test User",
  avatarUrl: null,
  mode: "co_hunter",
  city: "Bangalore",
};

/** Helper: scope queries to the desktop sidebar nav */
function sidebarNav() {
  return within(screen.getByRole("navigation", { name: "Primary" }));
}

it("renders children content", () => {
  render(
    <AppShell mode="co_hunter" user={mockUser}>
      <p>Page content</p>
    </AppShell>,
  );
  expect(screen.getByText("Page content")).toBeInTheDocument();
});

it("shows user greeting in header", () => {
  render(
    <AppShell mode="co_hunter" user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  const greetings = screen.getAllByText("Hi, Test!");
  expect(greetings.length).toBeGreaterThanOrEqual(1);
});

it("shows nav items filtered by mode — co_hunter", () => {
  render(
    <AppShell mode="co_hunter" user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  const nav = sidebarNav();
  expect(nav.getByText("Explore")).toBeInTheDocument();
  expect(nav.getByText("Swipe")).toBeInTheDocument();
  expect(nav.queryByText("Post & Manage")).not.toBeInTheDocument();
});

it("shows nav items filtered by mode — room_poster", () => {
  render(
    <AppShell mode="room_poster" user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  const nav = sidebarNav();
  expect(nav.getByText("Post & Manage")).toBeInTheDocument();
  expect(nav.queryByText("Explore")).not.toBeInTheDocument();
});

it("shows nav items filtered by mode — open_to_both", () => {
  render(
    <AppShell mode="open_to_both" user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  const nav = sidebarNav();
  expect(nav.getByText("Explore")).toBeInTheDocument();
  expect(nav.getByText("Post & Manage")).toBeInTheDocument();
  expect(nav.getByText("Dashboard")).toBeInTheDocument();
});

it("highlights active nav item", () => {
  render(
    <AppShell mode="co_hunter" activeHref="/explore" user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  const exploreLink = sidebarNav().getByText("Explore").closest("a");
  expect(exploreLink).toHaveAttribute("aria-current", "page");
});

it("does not highlight inactive nav items", () => {
  render(
    <AppShell mode="co_hunter" activeHref="/explore" user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  const homeLink = sidebarNav().getByText("Home").closest("a");
  expect(homeLink).not.toHaveAttribute("aria-current");
});

it("renders notification bell", () => {
  render(
    <AppShell mode="co_hunter" notificationCount={3} user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
});

it("renders without user", () => {
  render(
    <AppShell mode="co_hunter">
      <p>Content</p>
    </AppShell>,
  );
  expect(screen.getByText("Content")).toBeInTheDocument();
});

it("renders custom nav items", () => {
  const customItems = [
    { label: "Custom", href: "/custom", icon: () => null, showFor: ["co_hunter" as const] },
  ];
  render(
    <AppShell mode="co_hunter" navItems={customItems} user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  expect(sidebarNav().getByText("Custom")).toBeInTheDocument();
});

it("renders notification link with count zero hidden", () => {
  render(
    <AppShell mode="co_hunter" notificationCount={0} user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  expect(screen.queryByText("0")).not.toBeInTheDocument();
});

it("shows sidebar-only items in desktop sidebar (Dashboard for room_poster)", () => {
  render(
    <AppShell mode="room_poster" user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  expect(sidebarNav().getByText("Dashboard")).toBeInTheDocument();
});

it("collapse toggle button is rendered", () => {
  render(
    <AppShell mode="co_hunter" user={mockUser}>
      <p>Content</p>
    </AppShell>,
  );
  expect(
    screen.getByLabelText("Collapse sidebar"),
  ).toBeInTheDocument();
});

it("calls onCollapsedChange when toggle clicked", async () => {
  const onCollapsedChange = vi.fn();
  const user = userEvent.setup();
  render(
    <AppShell mode="co_hunter" user={mockUser} onCollapsedChange={onCollapsedChange}>
      <p>Content</p>
    </AppShell>,
  );
  await user.click(screen.getByLabelText("Collapse sidebar"));
  expect(onCollapsedChange).toHaveBeenCalledWith(true);
});
