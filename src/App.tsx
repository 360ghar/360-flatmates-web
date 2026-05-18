import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { Providers } from "./providers";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthGuard, AdminGuard, AuthRedirectGuard } from "./pages/guards";
import { PublicLayout } from "./pages/public/PublicLayout";
import { AuthLayout } from "./pages/auth/AuthLayout";
import { AppLayout } from "./pages/app/AppLayout";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { PageSpinner } from "./components/ui/Spinner";

// Public pages
const LandingPage = lazy(() => import("./pages/public/LandingPage").then((m) => ({ default: m.LandingPage })));
const AboutPage = lazy(() => import("./pages/public/AboutPage").then((m) => ({ default: m.AboutPage })));
const TermsPage = lazy(() => import("./pages/public/TermsPage").then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("./pages/public/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const StatsPage = lazy(() => import("./pages/public/StatsPage").then((m) => ({ default: m.StatsPage })));
const MaintenancePage = lazy(() => import("./pages/public/MaintenancePage").then((m) => ({ default: m.MaintenancePage })));
const ErrorPage = lazy(() => import("./pages/public/ErrorPage").then((m) => ({ default: m.ErrorPage })));
const DiscoverPage = lazy(() => import("./pages/public/DiscoverPage").then((m) => ({ default: m.DiscoverPage })));
const ListingDetailPage = lazy(() => import("./pages/public/ListingDetailPage").then((m) => ({ default: m.ListingDetailPage })));
const SearchPage = lazy(() => import("./pages/public/SearchPage").then((m) => ({ default: m.SearchPage })));
const SemanticSearchPage = lazy(() => import("./pages/public/SemanticSearchPage").then((m) => ({ default: m.SemanticSearchPage })));
const SharePage = lazy(() => import("./pages/public/SharePage").then((m) => ({ default: m.SharePage })));

// Auth pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("./pages/auth/SignupPage").then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })));
const AuthCallbackPage = lazy(() => import("./pages/auth/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage })));

// App pages
const HomePage = lazy(() => import("./pages/app/HomePage").then((m) => ({ default: m.HomePage })));
const SwipePage = lazy(() => import("./pages/app/SwipePage").then((m) => ({ default: m.SwipePage })));
const LikesPage = lazy(() => import("./pages/app/LikesPage").then((m) => ({ default: m.LikesPage })));
const MatchesPage = lazy(() => import("./pages/app/MatchesPage").then((m) => ({ default: m.MatchesPage })));
const ChatsPage = lazy(() => import("./pages/app/ChatsPage").then((m) => ({ default: m.ChatsPage })));
const ChatDetailPage = lazy(() => import("./pages/app/ChatDetailPage").then((m) => ({ default: m.ChatDetailPage })));
const ExplorePage = lazy(() => import("./pages/app/ExplorePage").then((m) => ({ default: m.ExplorePage })));
const NotificationsPage = lazy(() => import("./pages/app/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import("./pages/app/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const PublicProfilePage = lazy(() => import("./pages/app/PublicProfilePage").then((m) => ({ default: m.PublicProfilePage })));
const ProfileEditPage = lazy(() => import("./pages/app/ProfileEditPage").then((m) => ({ default: m.ProfileEditPage })));
const SettingsPage = lazy(() => import("./pages/app/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const AppearancePage = lazy(() => import("./pages/app/AppearancePage").then((m) => ({ default: m.AppearancePage })));
const SettingsNotificationsPage = lazy(() => import("./pages/app/SettingsNotificationsPage").then((m) => ({ default: m.SettingsNotificationsPage })));
const BlockedUsersPage = lazy(() => import("./pages/app/BlockedUsersPage").then((m) => ({ default: m.BlockedUsersPage })));
const ReportProblemPage = lazy(() => import("./pages/app/ReportProblemPage").then((m) => ({ default: m.ReportProblemPage })));
const PostPage = lazy(() => import("./pages/app/PostPage").then((m) => ({ default: m.PostPage })));
const PostReviewPage = lazy(() => import("./pages/app/PostReviewPage").then((m) => ({ default: m.PostReviewPage })));
const ManagePage = lazy(() => import("./pages/app/ManagePage").then((m) => ({ default: m.ManagePage })));
const DashboardPage = lazy(() => import("./pages/app/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const AnalyticsPage = lazy(() => import("./pages/app/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));
const VisitsPage = lazy(() => import("./pages/app/VisitsPage").then((m) => ({ default: m.VisitsPage })));
const VisitDetailPage = lazy(() => import("./pages/app/VisitDetailPage").then((m) => ({ default: m.VisitDetailPage })));
const CompatibilityPage = lazy(() => import("./pages/app/CompatibilityPage").then((m) => ({ default: m.CompatibilityPage })));
const MyListingDetailPage = lazy(() => import("./pages/app/MyListingDetailPage").then((m) => ({ default: m.MyListingDetailPage })));
const MyListingEditPage = lazy(() => import("./pages/app/MyListingEditPage").then((m) => ({ default: m.MyListingEditPage })));
const ChooseRolePage = lazy(() => import("./pages/app/ChooseRolePage").then((m) => ({ default: m.ChooseRolePage })));
const LocationPage = lazy(() => import("./pages/app/LocationPage").then((m) => ({ default: m.LocationPage })));
const OnboardingPage = lazy(() => import("./pages/app/OnboardingPage").then((m) => ({ default: m.OnboardingPage })));
const OnboardingStepPage = lazy(() => import("./pages/app/OnboardingStepPage").then((m) => ({ default: m.OnboardingStepPage })));
const VerifyPage = lazy(() => import("./pages/app/VerifyPage").then((m) => ({ default: m.VerifyPage })));
const HelpPage = lazy(() => import("./pages/app/HelpPage").then((m) => ({ default: m.HelpPage })));
const AlertsPage = lazy(() => import("./pages/app/AlertsPage").then((m) => ({ default: m.AlertsPage })));
const SavedSearchesPage = lazy(() => import("./pages/app/SavedSearchesPage").then((m) => ({ default: m.SavedSearchesPage })));

// Admin pages
const AdminStatsPage = lazy(() => import("./pages/admin/AdminStatsPage").then((m) => ({ default: m.AdminStatsPage })));
const ModerationListingsPage = lazy(() => import("./pages/admin/ModerationListingsPage").then((m) => ({ default: m.ModerationListingsPage })));
const ModerationReportsPage = lazy(() => import("./pages/admin/ModerationReportsPage").then((m) => ({ default: m.ModerationReportsPage })));
const PrescreenPage = lazy(() => import("./pages/admin/PrescreenPage").then((m) => ({ default: m.PrescreenPage })));

// Shared pages
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

export function App() {
  return (
    <HelmetProvider>
      <Providers>
        <ErrorBoundary>
          <Suspense fallback={<PageSpinner />}>
            <Routes>
            {/* ── Public routes ── */}
            <Route element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="discover" element={<DiscoverPage />} />
              <Route path="discover/:id" element={<ListingDetailPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="share/:id" element={<SharePage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="error" element={<ErrorPage />} />
            </Route>

            {/* ── Auth routes ── */}
            <Route element={<AuthRedirectGuard />}>
              <Route element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="signup" element={<SignupPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="auth/callback" element={<AuthCallbackPage />} />
              </Route>
            </Route>

            {/* ── Authenticated app routes ── */}
            <Route element={<AuthGuard />}>
              <Route element={<AppLayout />}>
                <Route path="home" element={<HomePage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="search/semantic" element={<SemanticSearchPage />} />
                <Route path="swipe" element={<SwipePage />} />
                <Route path="likes" element={<LikesPage />} />
                <Route path="matches" element={<MatchesPage />} />
                <Route path="chats" element={<ChatsPage />} />
                <Route path="chats/:id" element={<ChatDetailPage />} />
                <Route path="explore" element={<ExplorePage />} />
                <Route path="listing/:id" element={<ListingDetailPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/edit" element={<ProfileEditPage />} />
                <Route path="profile/:id" element={<PublicProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/appearance" element={<AppearancePage />} />
                <Route path="settings/notifications" element={<SettingsNotificationsPage />} />
                <Route path="settings/blocked-users" element={<BlockedUsersPage />} />
                <Route path="settings/report-problem" element={<ReportProblemPage />} />
                <Route path="post" element={<PostPage />} />
                <Route path="post/review" element={<PostReviewPage />} />
                <Route path="manage" element={<ManagePage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="dashboard/analytics" element={<AnalyticsPage />} />
                <Route path="visits" element={<VisitsPage />} />
                <Route path="visits/:id" element={<VisitDetailPage />} />
                <Route path="compatibility/:id" element={<CompatibilityPage />} />
                <Route path="my-listings/:id" element={<MyListingDetailPage />} />
                <Route path="my-listings/:id/edit" element={<MyListingEditPage />} />
                <Route path="choose-role" element={<ChooseRolePage />} />
                <Route path="location" element={<LocationPage />} />
                <Route path="onboarding" element={<OnboardingPage />} />
                <Route path="onboarding/:step" element={<OnboardingStepPage />} />
                <Route path="verify" element={<VerifyPage />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="saved-searches" element={<SavedSearchesPage />} />
              </Route>
            </Route>

            {/* ── Admin routes ── */}
            <Route element={<AdminGuard />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route path="stats" element={<AdminStatsPage />} />
                <Route path="moderation/listings" element={<ModerationListingsPage />} />
                <Route path="moderation/reports" element={<ModerationReportsPage />} />
                <Route path="moderation/prescreen/:id" element={<PrescreenPage />} />
              </Route>
            </Route>

            {/* ── Catch-all ── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </Providers>
    </HelmetProvider>
  );
}
