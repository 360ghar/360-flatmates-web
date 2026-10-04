/**
 * Login state-machine:
 *   identifier  → POST /auth/identifier-status →
 *     next_step === "password"  ⇒  password step (account already has a password)
 *     next_step === "otp"       ⇒  OTP step → verify code →
 *        has_password === false ⇒  MANDATORY, non-skippable set-password step
 *                                  before login completes
 *        has_password === true  ⇒  login completes immediately after OTP
 *
 * The set-password gate fires whenever `has_password === false` from
 * `/auth/identifier-status` (an unknown identifier is treated as no password).
 * It is NOT applied to the Google redirect path (handled in AuthCallbackPage),
 * which is passwordless by design.
 *
 * Supports both email and phone identifiers (auto-detected). This page is the
 * reference template for the other web apps.
 */
export type LoginStep = "identifier" | "password" | "otp" | "set-password";

export interface LoginFormState {
  step: LoginStep;
  identifier: string;
  password: string;
  confirmPassword: string;
  otp: string;
  mustSetPassword: boolean;
}

export type LoginFormAction =
  | { type: "changeIdentifier"; value: string }
  | { type: "setPassword"; value: string }
  | { type: "setConfirmPassword"; value: string }
  | { type: "setOtp"; value: string }
  | { type: "setStep"; step: LoginStep }
  | { type: "advanceToOtp"; mustSetPassword: boolean }
  | { type: "resetToIdentifier" }
  | { type: "fullReset" };

export function loginFormReducer(state: LoginFormState, action: LoginFormAction): LoginFormState {
  switch (action.type) {
    case "changeIdentifier":
      // Editing the identifier after branching returns to the identifier step
      // so a stale password/OTP form is never submitted against a different
      // identifier.
      if (state.step === "identifier") {
        return { ...state, identifier: action.value };
      }
      return {
        ...state,
        identifier: action.value,
        step: "identifier",
        mustSetPassword: false,
        password: "",
        confirmPassword: "",
        otp: ""
      };
    case "setPassword":
      return { ...state, password: action.value };
    case "setConfirmPassword":
      return { ...state, confirmPassword: action.value };
    case "setOtp":
      return { ...state, otp: action.value };
    case "setStep":
      return { ...state, step: action.step };
    case "advanceToOtp":
      return { ...state, step: "otp", mustSetPassword: action.mustSetPassword };
    case "resetToIdentifier":
      return {
        ...state,
        step: "identifier",
        password: "",
        confirmPassword: "",
        otp: "",
        mustSetPassword: false
      };
    case "fullReset":
      return {
        ...state,
        step: "identifier",
        identifier: "",
        password: "",
        confirmPassword: "",
        otp: "",
        mustSetPassword: false
      };
    default:
      return state;
  }
}

/** Lazy useReducer initializer — mirrors the previous per-field useState initializers. */
export function initLoginFormState(passwordSetupFlow: boolean): LoginFormState {
  return {
    step: passwordSetupFlow ? "set-password" : "identifier",
    // Seed the identifier from the URL on first render so a hard refresh
    // during the OTP step doesn't leave the user staring at an empty input.
    // The `?identifier=...` query param is set on advancing to the OTP step
    // and cleared on `goBackToIdentifier`.
    identifier:
      typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("identifier") ?? "",
    password: "",
    confirmPassword: "",
    otp: "",
    mustSetPassword: passwordSetupFlow
  };
}
