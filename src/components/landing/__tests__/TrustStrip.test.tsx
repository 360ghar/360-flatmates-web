import { render, screen } from "@/test-utils";
import { describe, expect, it } from "vitest";

import { TrustStrip } from "../TrustStrip";

describe("TrustStrip", () => {
  it("renders one accessible copy of each trust item", () => {
    const { container } = render(<TrustStrip />);

    expect(screen.getAllByText("Lifestyle compatibility")).toHaveLength(1);
    expect(screen.getAllByText("Room and profile signals")).toHaveLength(1);
    expect(container.querySelector("ul.sr-only")).toBeNull();
  });
});
