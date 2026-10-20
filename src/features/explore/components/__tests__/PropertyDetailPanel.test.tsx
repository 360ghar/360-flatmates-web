import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test-utils";
import { PropertyDetailPanel } from "@/features/explore/components/PropertyDetailPanel";
import type { MapPin, Property } from "@/lib/api/types";

const pin: MapPin = {
  id: 42,
  lat: 12.9716,
  lng: 77.5946,
  title: "Spacious 2BHK",
  locality: "Indiranagar",
  monthly_rent: 35000,
  main_image_url: "https://example.com/photo.jpg",
};

const baseProperty = {
  id: 42,
  owner_id: 99,
  property_type: "apartment",
  purpose: "rent",
  title: "Spacious 2BHK in Indiranagar",
  city: "Bangalore",
  locality: "Indiranagar",
  monthly_rent: 35000,
  bedrooms: 2,
  bathrooms: 2,
  area_sqft: 1200,
  description: "A bright, quiet flat with a balcony.",
  features: ["Wifi", "Parking"],
  images: [
    { id: 1, image_url: "https://example.com/a.jpg", display_order: 0, is_main_image: true },
    { id: 2, image_url: "https://example.com/b.jpg", display_order: 1, is_main_image: false }
  ],
  owner_name: "Riya Sharma",
} as Property;

it("renders skeletons while loading", () => {
  const { container } = render(
    <PropertyDetailPanel
      selectedPin={pin}
      fullProperty={undefined}
      isPropertyLoading
      onClose={vi.fn()}
      onNavigate={vi.fn()}
    />
  );
  expect(screen.getByRole("heading", { name: "Place" })).toBeInTheDocument();
  expect(container.querySelectorAll(".shimmer").length).toBeGreaterThan(0);
});

it("renders empty fallback when not loading and no property", () => {
  render(
    <PropertyDetailPanel
      selectedPin={pin}
      fullProperty={undefined}
      isPropertyLoading={false}
      onClose={vi.fn()}
      onNavigate={vi.fn()}
    />
  );
  expect(screen.getByText(/no details for this place/i)).toBeInTheDocument();
});

it("renders full content from fullProperty", () => {
  render(
    <PropertyDetailPanel
      selectedPin={pin}
      fullProperty={baseProperty}
      isPropertyLoading={false}
      onClose={vi.fn()}
      onNavigate={vi.fn()}
    />
  );
  expect(screen.getByText("Spacious 2BHK in Indiranagar")).toBeInTheDocument();
  expect(screen.getByText(/Indiranagar.*Bangalore/)).toBeInTheDocument();
  expect(screen.getByText(/2 BHK/)).toBeInTheDocument();
  expect(screen.getByText(/1200 sq ft/)).toBeInTheDocument();
  expect(screen.getByText("Riya Sharma")).toBeInTheDocument();
  expect(screen.getByText(/2 photos/)).toBeInTheDocument();
});

it("uses the shared price fallback when rent is missing or invalid", () => {
  render(
    <PropertyDetailPanel
      selectedPin={pin}
      fullProperty={{ ...baseProperty, monthly_rent: 0 }}
      isPropertyLoading={false}
      onClose={vi.fn()}
      onNavigate={vi.fn()}
    />
  );

  expect(screen.getAllByText("Price on request")).toHaveLength(1);
});

it("invokes onClose when close button is clicked", async () => {
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(
    <PropertyDetailPanel
      selectedPin={pin}
      fullProperty={baseProperty}
      isPropertyLoading={false}
      onClose={onClose}
      onNavigate={vi.fn()}
    />
  );
  await user.click(screen.getByLabelText("Close"));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("navigates to listing detail on View listing click", async () => {
  const onNavigate = vi.fn();
  const user = userEvent.setup();
  render(
    <PropertyDetailPanel
      selectedPin={pin}
      fullProperty={baseProperty}
      isPropertyLoading={false}
      onClose={vi.fn()}
      onNavigate={onNavigate}
    />
  );
  await user.click(screen.getByRole("button", { name: /view listing/i }));
  expect(onNavigate).toHaveBeenCalledWith("/listing/42");
});

it("navigates to the owner's public profile", async () => {
  const onNavigate = vi.fn();
  const user = userEvent.setup();
  render(
    <PropertyDetailPanel
      selectedPin={pin}
      fullProperty={baseProperty}
      isPropertyLoading={false}
      onClose={vi.fn()}
      onNavigate={onNavigate}
    />
  );
  await user.click(screen.getByRole("button", { name: /riya.s profile/i }));
  expect(onNavigate).toHaveBeenCalledWith("/profile/99");
});

it("keeps the profile link with a generic label when the owner has no name", () => {
  render(
    <PropertyDetailPanel
      selectedPin={pin}
      fullProperty={{ ...baseProperty, owner_name: null }}
      isPropertyLoading={false}
      onClose={vi.fn()}
      onNavigate={vi.fn()}
    />
  );
  expect(screen.getByRole("button", { name: "See the owner's profile" })).toBeInTheDocument();
});
