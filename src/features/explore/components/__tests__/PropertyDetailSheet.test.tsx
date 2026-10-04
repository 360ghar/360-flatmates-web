import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test-utils";
import { PropertyDetailSheet } from "@/features/explore/components/PropertyDetailSheet";
import type { MapPin } from "@/lib/api/types";

const pin: MapPin = {
  id: 42,
  lat: 12.9716,
  lng: 77.5946,
  title: "Spacious 2BHK in Indiranagar",
  locality: "Indiranagar",
  monthly_rent: 35000,
  main_image_url: "https://example.com/photo.jpg",
};

it("renders pin title, locality and rent", () => {
  render(<PropertyDetailSheet pin={pin} onClose={vi.fn()} onNavigate={vi.fn()} />);
  expect(screen.getByText("Spacious 2BHK in Indiranagar")).toBeInTheDocument();
  expect(screen.getByText("Indiranagar")).toBeInTheDocument();
});

it("invokes onClose when close button is clicked", async () => {
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(<PropertyDetailSheet pin={pin} onClose={onClose} onNavigate={vi.fn()} />);
  await user.click(screen.getByLabelText("Close"));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("navigates to listing detail on View listing click", async () => {
  const onNavigate = vi.fn();
  const user = userEvent.setup();
  render(<PropertyDetailSheet pin={pin} onClose={vi.fn()} onNavigate={onNavigate} />);
  await user.click(screen.getByRole("button", { name: /view listing/i }));
  expect(onNavigate).toHaveBeenCalledWith("/listing/42");
});

it("omits locality when not provided", () => {
  const { queryByText } = render(
    <PropertyDetailSheet pin={{ ...pin, locality: undefined }} onClose={vi.fn()} onNavigate={vi.fn()} />
  );
  expect(queryByText("Indiranagar")).not.toBeInTheDocument();
});

it("renders without main_image_url", () => {
  const pinNoImage: MapPin = { ...pin, main_image_url: undefined };
  render(<PropertyDetailSheet pin={pinNoImage} onClose={vi.fn()} onNavigate={vi.fn()} />);
  expect(screen.getByText("Spacious 2BHK in Indiranagar")).toBeInTheDocument();
});
