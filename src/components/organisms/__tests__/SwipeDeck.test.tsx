import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test-utils";
import { SwipeDeck, type SwipeProfile } from "../SwipeDeck";

const profile: SwipeProfile = {
  id: "p1",
  name: "Alice",
  age: 28,
  photoUrl: null,
  matchScore: 85,
  location: "Bangalore",
  sleepSchedule: "night_owl",
  cleanliness: "tidy",
  foodHabits: "vegetarian",
  smokingDrinking: "neither",
  guestsPolicy: "occasional_ok",
  workStyle: "hybrid",
  genderPreference: "any",
  hasPets: false,
  nonNegotiables: ["no_smoking", "food_veg_only"],
  compatibilityDimensions: [
    {
      name: "sleep_schedule",
      label: "Sleep Schedule",
      weight: 0.2,
      user_value: "early_bird",
      peer_value: "night_owl",
      score: 0,
      match: false,
      summary: "Sleep Schedule: preference gap"
    },
    {
      name: "cleanliness",
      label: "Cleanliness",
      weight: 0.2,
      user_value: "tidy",
      peer_value: "tidy",
      score: 100,
      match: true,
      summary: "Cleanliness: strong match"
    },
    {
      name: "food_habits",
      label: "Food Habits",
      weight: 0.15,
      user_value: "vegetarian",
      peer_value: "vegetarian",
      score: 100,
      match: true,
      summary: "Food Habits: strong match"
    },
    {
      name: "smoking_drinking",
      label: "Smoking/Drinking",
      weight: 0.2,
      user_value: "neither",
      peer_value: "neither",
      score: 100,
      match: true,
      summary: "Smoking/Drinking: strong match"
    },
    {
      name: "guests_policy",
      label: "Guests Policy",
      weight: 0.15,
      user_value: "occasional_ok",
      peer_value: "occasional_ok",
      score: 100,
      match: true,
      summary: "Guests Policy: strong match"
    },
    {
      name: "work_style",
      label: "Work Style",
      weight: 0.1,
      user_value: "hybrid",
      peer_value: "hybrid",
      score: 100,
      match: true,
      summary: "Work Style: strong match"
    }
  ]
};

const profile2: SwipeProfile = {
  id: "p2",
  name: "Bob",
  age: 30,
  photoUrl: null,
  matchScore: 72,
};

const profile3: SwipeProfile = {
  id: "p3",
  name: "Carol",
  age: 25,
  photoUrl: null,
  matchScore: 90,
};

const manyProfiles = [profile, profile2, profile3];

it("renders current profile name", () => {
  render(<SwipeDeck profiles={manyProfiles} />);
  // Name renders with age suffix ("Alice, 28") in h2 elements
  const names = screen.getAllByText(/Alice/);
  expect(names.length).toBeGreaterThanOrEqual(1);
});

it("shows lifestyle grid, deal-breakers, and full compatibility in expanded card", () => {
  // Desktop starts expanded (jsdom width is not mobile)
  render(<SwipeDeck profiles={manyProfiles} />);
  expect(screen.getByText("Lifestyle")).toBeInTheDocument();
  expect(screen.getByText("Deal-breakers")).toBeInTheDocument();
  expect(screen.getByText("Non-negotiables they set")).toBeInTheDocument();
  expect(screen.getByText("No Smoking")).toBeInTheDocument();
  expect(screen.getByText("Veg Only")).toBeInTheDocument();
  expect(screen.getByText("Compatibility")).toBeInTheDocument();
  expect(screen.getAllByText("Great match").length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/aligned/)).toBeInTheDocument();
  // Lifestyle grid + dimension rows both use these labels
  expect(screen.getAllByText("Sleep Schedule").length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText("Cleanliness").length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText("Food Habits").length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText("Smoking/Drinking").length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText("Guests Policy").length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText("Work Style").length).toBeGreaterThanOrEqual(1);
});

it("renders empty state when no profiles", () => {
  render(<SwipeDeck profiles={[]} onEmptyAction={vi.fn()} />);
  expect(screen.getByText("No profiles waiting")).toBeInTheDocument();
  expect(screen.getByText("Explore Listings")).toBeInTheDocument();
});

it("calls onEmptyAction from empty state button", async () => {
  const onEmptyAction = vi.fn();
  const user = userEvent.setup();
  render(<SwipeDeck profiles={[]} onEmptyAction={onEmptyAction} />);
  await user.click(screen.getByText("Explore Listings"));
  expect(onEmptyAction).toHaveBeenCalled();
});

it("renders swipe action buttons", () => {
  render(<SwipeDeck profiles={manyProfiles} />);
  expect(screen.getByLabelText("Pass")).toBeInTheDocument();
  expect(screen.getByLabelText("Like")).toBeInTheDocument();
  expect(screen.getByLabelText("Super Like")).toBeInTheDocument();
});

it("calls onPass when Pass button clicked", async () => {
  const onPass = vi.fn();
  const user = userEvent.setup();
  render(<SwipeDeck profiles={manyProfiles} onPass={onPass} />);
  await user.click(screen.getByLabelText("Pass"));
  expect(onPass).toHaveBeenCalledWith("p1");
});

it("calls onLike when Like button clicked", async () => {
  const onLike = vi.fn();
  const user = userEvent.setup();
  render(<SwipeDeck profiles={manyProfiles} onLike={onLike} />);
  await user.click(screen.getByLabelText("Like"));
  expect(onLike).toHaveBeenCalledWith("p1");
});

it("calls onSuperLike when Super Like button clicked", async () => {
  const onSuperLike = vi.fn();
  const user = userEvent.setup();
  render(<SwipeDeck profiles={manyProfiles} onSuperLike={onSuperLike} />);
  await user.click(screen.getByLabelText("Super Like"));
  expect(onSuperLike).toHaveBeenCalledWith("p1");
});

it("ArrowLeft key triggers pass", () => {
  const onPass = vi.fn();
  render(<SwipeDeck profiles={manyProfiles} onPass={onPass} />);
  const region = screen.getByRole("region", { name: /Profile cards/ });
  fireEvent.keyDown(region, { key: "ArrowLeft" });
  expect(onPass).toHaveBeenCalledWith("p1");
});

it("ArrowRight key triggers like", () => {
  const onLike = vi.fn();
  render(<SwipeDeck profiles={manyProfiles} onLike={onLike} />);
  const region = screen.getByRole("region", { name: /Profile cards/ });
  fireEvent.keyDown(region, { key: "ArrowRight" });
  expect(onLike).toHaveBeenCalledWith("p1");
});

it("ArrowUp key triggers super-like (collapsed view)", () => {
  const onSuperLike = vi.fn();
  render(<SwipeDeck profiles={manyProfiles} onSuperLike={onSuperLike} />);
  const region = screen.getByRole("region", { name: /Profile cards/ });
  // Default isExpanded=true, so ArrowUp is disabled. First collapse with Escape, then ArrowUp.
  fireEvent.keyDown(region, { key: "Escape" });
  fireEvent.keyDown(region, { key: "ArrowUp" });
  expect(onSuperLike).toHaveBeenCalledWith("p1");
});

it("Space key toggles collapse then expand", () => {
  const onExpand = vi.fn();
  render(<SwipeDeck profiles={manyProfiles} onExpand={onExpand} />);
  const region = screen.getByRole("region", { name: /Profile cards/ });
  // First Escape to collapse from expanded, then Space to expand
  fireEvent.keyDown(region, { key: "Escape" });
  fireEvent.keyDown(region, { key: " " });
  expect(onExpand).toHaveBeenCalledWith("p1");
});

it("Escape key collapses expanded card", () => {
  render(<SwipeDeck profiles={manyProfiles} />);
  const region = screen.getByRole("region", { name: /Profile cards/ });
  // Card starts expanded; Escape should collapse it
  const collapseButton = screen.getByLabelText("Collapse profile details");
  expect(collapseButton).toBeInTheDocument();
  fireEvent.keyDown(region, { key: "Escape" });
  // After collapse, the "View ... profile details" button should appear
  expect(screen.getByLabelText("View Alice's profile details")).toBeInTheDocument();
});

it("calls onNearEnd when within 3 of end", () => {
  const onNearEnd = vi.fn();
  // 3 profiles → currentIndex=0, length-3=0, so 0 >= 0 triggers
  render(<SwipeDeck profiles={manyProfiles} onNearEnd={onNearEnd} />);
  expect(onNearEnd).toHaveBeenCalled();
});

it("does not call onNearEnd when plenty of cards remain", () => {
  const onNearEnd = vi.fn();
  const five = [profile, profile2, profile3, { ...profile, id: "p4" }, { ...profile, id: "p5" }];
  render(<SwipeDeck profiles={five} onNearEnd={onNearEnd} />);
  expect(onNearEnd).not.toHaveBeenCalled();
});

it("shows progress ring with match score", () => {
  render(<SwipeDeck profiles={[profile]} />);
  // ProgressRing may appear more than once (hero + summary strip)
  expect(screen.getAllByText("85%").length).toBeGreaterThanOrEqual(1);
});

it("disables action buttons when isAnimating is true", () => {
  render(<SwipeDeck profiles={manyProfiles} isAnimating />);
  expect(screen.getByLabelText("Pass")).toBeDisabled();
  expect(screen.getByLabelText("Like")).toBeDisabled();
  expect(screen.getByLabelText("Super Like")).toBeDisabled();
});
