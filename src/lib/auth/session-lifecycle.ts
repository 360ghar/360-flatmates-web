// Invalidates async session reads/refreshes that started before sign-out.
let revision = 0;
let signingOut = false;

export const authSessionLifecycle = {
  get revision() { return revision; },
  get signingOut() { return signingOut; },
  beginSignOut() { revision += 1; signingOut = true; },
  finishSignOut() { signingOut = false; },
  signedOut() { revision += 1; },
  isCurrent(startedAt: number) { return !signingOut && startedAt === revision; }
};
