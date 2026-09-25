import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { useDirtyFormGuard } from "../useDirtyFormGuard";

function Form() {
  const blocker = useDirtyFormGuard(true, "Unsaved");
  return (
    <div>
      <Link to="/elsewhere">Sidebar link</Link>
      <p>state:{blocker.state}</p>
      <button type="button" onClick={() => blocker.proceed?.()}>Leave</button>
    </div>
  );
}

// W13 regression: in-app links are held while the form is dirty.
describe("useDirtyFormGuard link interception", () => {
  it("blocks a link click, then navigates on proceed", () => {
    render(
      <MemoryRouter initialEntries={["/edit"]}>
        <Routes>
          <Route path="/edit" element={<Form />} />
          <Route path="/elsewhere" element={<p>Elsewhere page</p>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Sidebar link"));
    expect(screen.getByText("state:blocked")).toBeInTheDocument();
    expect(screen.queryByText("Elsewhere page")).toBeNull();
    fireEvent.click(screen.getByText("Leave"));
    expect(screen.getByText("Elsewhere page")).toBeInTheDocument();
  });
});
