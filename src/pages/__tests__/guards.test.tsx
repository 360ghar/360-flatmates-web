import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import type { User } from "@supabase/supabase-js";

import { authStore } from "@/lib/stores/auth-store";

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { AuthRedirectGuard } from "@/pages/guards";

const signedInUser = { id: "user-1" } as User;

function renderLoginUnderGuard() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route element={<AuthRedirectGuard />}>
          <Route path="/login" element={<div>login page</div>} />
        </Route>
        <Route path="/home" element={<div>home page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AuthRedirectGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStore.setState({
      midAuthFlow: false,
      authStage: "unknown",
      authStageError: null,
      missingProfileFields: [],
    });
  });

  it("redirects a signed-in user off /login to /home", () => {
    mockUseAuth.mockReturnValue({ user: signedInUser, loading: false });
    authStore.getState().setAuthStage("active");

    renderLoginUnderGuard();

    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("waits on /login while a signed-in user's auth stage is unknown", () => {
    mockUseAuth.mockReturnValue({ user: signedInUser, loading: false });

    const { container } = renderLoginUnderGuard();

    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("home page")).not.toBeInTheDocument();
  });

  it("holds a signed-in user on /login while midAuthFlow is set (mandatory set-password)", () => {
    // OTP verification creates a session before the set-password / new-password
    // step completes — the guard must not bounce the user mid-flow.
    mockUseAuth.mockReturnValue({ user: signedInUser, loading: false });
    authStore.getState().setMidAuthFlow(true);

    renderLoginUnderGuard();

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders /login normally for a signed-out user", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    renderLoginUnderGuard();

    expect(screen.getByText("login page")).toBeInTheDocument();
  });
});
