import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EmptyState, ErrorState } from "../StateViews";
import { PaperScene } from "@/components/paper/PaperScene";

describe("paper state views", () => {
  it("EmptyState shows the requested scene prop, title and one action", () => {
    const onAction = vi.fn();
    render(<EmptyState title="No chats yet" scene="chat" actionLabel="Find flatmates" onAction={onAction} />);
    expect(screen.getByTestId("paper-mini-scene")).toHaveAttribute("data-prop", "chat");
    fireEvent.click(screen.getByRole("button", { name: "Find flatmates" }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("ErrorState is an alert with a rain-cloud scene and Retry", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Could not load" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("paper-mini-scene")).toHaveAttribute("data-prop", "rainCloud");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("PaperScene paints every layer and hides the art from screen readers", () => {
    render(<PaperScene />);
    const scene = screen.getByTestId("paper-scene");
    const layers = scene.querySelectorAll("svg[aria-hidden='true']");
    expect(layers.length).toBe(9);
    // Content is never hidden behind an entrance animation.
    layers.forEach((layer) => expect((layer as SVGElement).style.opacity).not.toBe("0"));
  });
});
