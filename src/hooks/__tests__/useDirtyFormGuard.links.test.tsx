import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, Link, RouterProvider, useNavigate } from "react-router";
import { useDirtyFormGuard } from "../useDirtyFormGuard";

function Form() {
  const blocker = useDirtyFormGuard(true, "Unsaved");
  const navigate = useNavigate();
  return (
    <div>
      <Link to="/elsewhere">Sidebar link</Link>
      <p>state:{blocker.state}</p>
      <button type="button" onClick={() => blocker.proceed?.()}>Leave</button>
      <button type="button" onClick={() => blocker.reset?.()}>Stay</button>
      <button type="button" onClick={() => navigate("/elsewhere", { state: { skipDirtyGuard: true } })}>Saved</button>
    </div>
  );
}

function setup() {
  const router = createMemoryRouter(
    [
      { path: "/start", element: <p>Start page</p> },
      { path: "/edit", element: <Form /> },
      { path: "/elsewhere", element: <p>Elsewhere page</p> }
    ],
    { initialEntries: ["/start", "/edit"], initialIndex: 1 }
  );
  render(<RouterProvider router={router} />);
  return router;
}

// W13 regression: a dirty form holds every way of leaving the page.
describe("useDirtyFormGuard", () => {
  it("holds a link click, then navigates on proceed", () => {
    setup();
    fireEvent.click(screen.getByText("Sidebar link"));
    expect(screen.getByText("state:blocked")).toBeInTheDocument();
    expect(screen.queryByText("Elsewhere page")).toBeNull();
    fireEvent.click(screen.getByText("Leave"));
    expect(screen.getByText("Elsewhere page")).toBeInTheDocument();
  });

  it("holds browser Back until the user chooses", async () => {
    const router = setup();
    await act(() => router.navigate(-1));
    expect(screen.getByText("state:blocked")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Stay"));
    expect(screen.getByText("state:unblocked")).toBeInTheDocument();
    await act(() => router.navigate(-1));
    fireEvent.click(screen.getByText("Leave"));
    expect(await screen.findByText("Start page")).toBeInTheDocument();
  });

  it("lets a post-save navigation through", () => {
    setup();
    fireEvent.click(screen.getByText("Saved"));
    expect(screen.getByText("Elsewhere page")).toBeInTheDocument();
  });
});
