import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test-utils";
import { PropertyDetailPanel } from "../PropertyDetailPanel";
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

const baseProperty: Property = {
  id: 42,
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
  image_urls: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
  owner: {
    id: 99,
    full_name: "Riya Sharma",
  },
};

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
  expect(screen.getByText("Property Details")).toBeInTheDocument();
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
  expect(screen.getByText(/no details available/i)).toBeInTheDocument();
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
  expect(screen.getByText(/1200 sqft/)).toBeInTheDocument();
  expect(screen.getByText("Riya Sharma")).toBeInTheDocument();
  expect(screen.getByText(/Swipe for more \(2\)/)).toBeInTheDocument();
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

  expect(screen.getAllByText("Price on request")).toHaveLength(2);
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

it("navigates to listing detail on View Details click", async () => {
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
  await user.click(screen.getByRole("button", { name: /view details/i }));
  expect(onNavigate).toHaveBeenCalledWith("/listing/42");
});

it("navigates to owner public profile on Contact Host click", async () => {
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
  await user.click(screen.getByRole("button", { name: /contact host/i }));
  expect(onNavigate).toHaveBeenCalledWith("/profile/99");
});

it("hides Contact Host when property has no owner", () => {
  render(
    <PropertyDetailPanel
      selectedPin={pin}
      fullProperty={{ ...baseProperty, owner: undefined }}
      isPropertyLoading={false}
      onClose={vi.fn()}
      onNavigate={vi.fn()}
    />
  );
  expect(screen.queryByRole("button", { name: /contact host/i })).not.toBeInTheDocument();
});
