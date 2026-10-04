import { describe, it, expect } from "vitest";
import { propertyToListingCardProps } from "../adapters";
import type { Property } from "@/lib/api/types";

describe("propertyToListingCardProps", () => {
  it("converts number ID to string", () => {
    const property = {
      id: 42,
      property_type: "flatmate",
      purpose: "rent",
      title: "Test Room",
      city: "Bangalore",
      locality: "Indiranagar",
      monthly_rent: 28500,
      bedrooms: 3,
      bathrooms: 2,
      area_sqft: 1250,
      main_image_url: "https://example.com/image.jpg",
      features: ["wifi", "balcony"],
      interest_count: 10
    } as Property;

    const result = propertyToListingCardProps(property);
    expect(result.id).toBe("42");
    expect(typeof result.id).toBe("string");
  });

  it("maps snake_case fields to camelCase", () => {
    const property = {
      id: 1,
      property_type: "flatmate",
      purpose: "rent",
      title: "Sunny Room",
      city: "Bangalore",
      locality: "HSR",
      monthly_rent: 25000,
      bedrooms: 2,
      bathrooms: 1,
      area_sqft: 800,
      main_image_url: "https://example.com/img.jpg",
      features: ["wifi"],
      interest_count: 5,
      owner_name: "Rohan"
    } as Property;

    const result = propertyToListingCardProps(property);
    expect(result.price).toBe(25000);
    expect(result.areaSqFt).toBe(800);
    expect(result.interestCount).toBe(5);
    expect(result.imageUrl).toBe("https://example.com/img.jpg");
  });

  it("maps owner object when present", () => {
    const property = {
      id: 1,
      property_type: "flatmate",
      purpose: "rent",
      title: "Room",
      city: "Bangalore",
      locality: "HSR",
      monthly_rent: 20000,
      owner: {
        id: 10,
        full_name: "Rohan Mehta",
        profile_image_url: "https://example.com/avatar.jpg"
      }
    } as Property;

    const result = propertyToListingCardProps(property);
    expect(result.owner).toEqual({
      name: "Rohan Mehta",
      avatarUrl: "https://example.com/avatar.jpg"
    });
  });
});
