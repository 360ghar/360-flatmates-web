import { describe, it, expect, beforeEach } from "vitest";
import { swipeStore } from "@/features/swipe/store";
describe("swipeStore", () => {
  beforeEach(() => {
    swipeStore.setState(swipeStore.getInitialState());
  });

  it("should have correct initial state", () => {
    const state = swipeStore.getState();
    expect(state.currentIndex).toBe(0);
    expect(state.isAnimating).toBe(false);
    expect(state.direction).toBeNull();
    expect(state.isExpanded).toBe(false);
  });

  it("incrementIndex increments currentIndex", () => {
    swipeStore.getState().incrementIndex();
    expect(swipeStore.getState().currentIndex).toBe(1);

    swipeStore.getState().incrementIndex();
    expect(swipeStore.getState().currentIndex).toBe(2);
  });

  it("resetIndex resets currentIndex to 0", () => {
    swipeStore.getState().incrementIndex();
    swipeStore.getState().incrementIndex();
    swipeStore.getState().resetIndex();
    expect(swipeStore.getState().currentIndex).toBe(0);
  });

  it("setAnimating sets isAnimating", () => {
    swipeStore.getState().setAnimating(true);
    expect(swipeStore.getState().isAnimating).toBe(true);

    swipeStore.getState().setAnimating(false);
    expect(swipeStore.getState().isAnimating).toBe(false);
  });

  it("setDirection sets direction", () => {
    swipeStore.getState().setDirection("left");
    expect(swipeStore.getState().direction).toBe("left");

    swipeStore.getState().setDirection("right");
    expect(swipeStore.getState().direction).toBe("right");

    swipeStore.getState().setDirection("up");
    expect(swipeStore.getState().direction).toBe("up");
  });

  it("clearDirection sets direction to null", () => {
    swipeStore.getState().setDirection("left");
    swipeStore.getState().clearDirection();
    expect(swipeStore.getState().direction).toBeNull();
  });

  it("toggleExpanded flips isExpanded", () => {
    swipeStore.getState().toggleExpanded();
    expect(swipeStore.getState().isExpanded).toBe(true);

    swipeStore.getState().toggleExpanded();
    expect(swipeStore.getState().isExpanded).toBe(false);
  });

  it("setExpanded sets isExpanded directly", () => {
    swipeStore.getState().setExpanded(true);
    expect(swipeStore.getState().isExpanded).toBe(true);

    swipeStore.getState().setExpanded(false);
    expect(swipeStore.getState().isExpanded).toBe(false);
  });
});
