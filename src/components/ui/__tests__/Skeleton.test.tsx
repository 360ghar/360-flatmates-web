import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "../Skeleton";

describe("Skeleton", () => {
  it("renders a leaf bone with size classes and no status role", () => {
    const { container } = render(<Skeleton className="h-8 w-32 rounded-full" />);
    const bone = container.firstElementChild as HTMLElement;
    expect(bone).toHaveAttribute("aria-hidden", "true");
    expect(bone).toHaveClass("shimmer", "h-8", "w-32");
    // Default h-4 must not fight caller-supplied height (cn has no twMerge)
    expect(bone.className.split(/\s+/)).not.toContain("h-4");
    expect(bone).not.toHaveAttribute("role", "status");
  });

  it("announces composite variants as a loading status", () => {
    render(<Skeleton variant="listingCard" />);
    const status = screen.getByRole("status", { name: /loading/i });
    expect(status).toHaveAttribute("aria-busy", "true");
  });

  it("renders listing cards with media-style full-bleed image aspect", () => {
    const { container } = render(<Skeleton variant="listingCard" />);
    expect(container.querySelector(".aspect-\\[20\\/19\\]")).toBeTruthy();
    // Compact pill CTA (not full-width bar)
    expect(container.querySelector(".rounded-full")).toBeTruthy();
  });

  it("renders profile grid cards with compact 3/4 aspect", () => {
    const { container } = render(<Skeleton variant="profileGridCard" />);
    expect(container.querySelector(".aspect-\\[3\\/4\\]")).toBeTruthy();
  });

  it("renders blog cards instead of listing geometry", () => {
    const { container } = render(<Skeleton variant="blogCard" count={2} className="grid gap-4" />);
    expect(container.querySelectorAll(".h-56").length).toBe(2);
    expect(container.querySelector(".aspect-\\[20\\/19\\]")).toBeNull();
  });

  it("renders homeFeed with fixed-width carousel slots", () => {
    const { container } = render(<Skeleton variant="homeFeed" />);
    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
    expect(container.querySelectorAll(".w-\\[180px\\]").length).toBeGreaterThan(0);
  });

  it("renders mapExplore with map grid texture", () => {
    const { container } = render(<Skeleton variant="mapExplore" className="h-96" />);
    expect(container.querySelector(".map-grid-bg")).toBeTruthy();
  });

  it("respects count for list variants and caller layout className", () => {
    const { container } = render(
      <Skeleton variant="notificationCard" count={3} className="flex flex-col gap-2" />
    );
    const root = screen.getByRole("status", { name: /loading/i });
    expect(root).toHaveClass("flex", "flex-col", "gap-2");
    // 3 cards each with an avatar circle
    expect(container.querySelectorAll(".rounded-full.h-12").length).toBe(3);
  });

  it("renders chatThread, form, compatibility, and dashboardPanel", () => {
    for (const variant of [
      "chatThread",
      "form",
      "compatibility",
      "dashboardPanel",
      "profilePage",
      "blogPost",
      "swipeCard",
    ] as const) {
      const { unmount } = render(<Skeleton variant={variant} />);
      expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
      unmount();
    }
  });
});
