import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test-utils";
import { ListingCard, type ListingCardData } from "../ListingCard";

const listing: ListingCardData = {
  id: "listing-1",
  title: "Sunny room in Indiranagar",
  price: 25000,
  locality: "Indiranagar",
  city: "Bangalore",
};

describe("ListingCard", () => {
  it("uses onContact without triggering onOpen", async () => {
    const user = userEvent.setup();
    const onContact = vi.fn();
    const onOpen = vi.fn();

    render(<ListingCard listing={listing} onContact={onContact} onOpen={onOpen} />);

    await user.click(screen.getByRole("button", { name: /contact/i }));

    expect(onContact).toHaveBeenCalledWith("listing-1");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("falls through to the card open handler only once when onContact is absent", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(<ListingCard listing={listing} onOpen={onOpen} />);

    await user.click(screen.getByRole("button", { name: /contact/i }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith("listing-1");
  });

  it("uses media Card variant for elevated photo-first layout", () => {
    const { container } = render(<ListingCard listing={listing} onOpen={vi.fn()} />);
    const article = container.querySelector("article");
    expect(article).toBeTruthy();
    expect(article!.className).toMatch(/p-0/);
    expect(article!.className).toMatch(/shadow-sm/);
    expect(article!.className).toMatch(/bg-surface/);
    expect(article!.className).not.toMatch(/bg-transparent/);
  });
});
