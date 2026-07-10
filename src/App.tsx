import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { Providers } from "./providers";
import { ErrorBoundary, RouteBoundary } from "./components/ErrorBoundary";
import { AuthGuard, AdminGuard, AuthRedirectGuard, GateGuard } from "./pages/guards";
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
const MaintenancePage = lazy(() => import("./pages/public/MaintenancePage").then((m) => ({ default: m.MaintenancePage })));
const ErrorPage = lazy(() => import("./pages/public/ErrorPage").then((m) => ({ default: m.ErrorPage })));
const DiscoverPage = lazy(() => import("./pages/public/DiscoverPage").then((m) => ({ default: m.DiscoverPage })));
const ListingDetailPage = lazy(() => import("./pages/public/ListingDetailPage").then((m) => ({ default: m.ListingDetailPage })));
const SharePage = lazy(() => import("./pages/public/SharePage").then((m) => ({ default: m.SharePage })));
const SearchPage = lazy(() => import("./pages/public/SearchPage").then((m) => ({ default: m.SearchPage })));
const SemanticSearchPage = lazy(() => import("./pages/public/SemanticSearchPage").then((m) => ({ default: m.SemanticSearchPage })));
const CityPage = lazy(() => import("./pages/public/CityPage").then((m) => ({ default: m.CityPage })));
const NeighborhoodPage = lazy(() => import("./pages/public/NeighborhoodPage").then((m) => ({ default: m.NeighborhoodPage })));
const BlogPage = lazy(() => import("./pages/public/BlogPage").then((m) => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import("./pages/public/BlogPostPage").then((m) => ({ default: m.BlogPostPage })));
const BlogPreviewPage = lazy(() => import("./pages/app/BlogPostPage").then((m) => ({ default: m.BlogPostPage })));
const ComparisonPage = lazy(() => import("./pages/public/ComparisonPage").then((m) => ({ default: m.ComparisonPage })));

// Auth pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })));
const AuthCallbackPage = lazy(() => import("./pages/auth/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage })));
const AddPhonePage = lazy(() => import("./pages/auth/AddPhonePage").then((m) => ({ default: m.AddPhonePage })));

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
const HelpPage = lazy(() => import("./pages/app/HelpPage").then((m) => ({ default: m.HelpPage })));
const AlertsPage = lazy(() => import("./pages/app/AlertsPage").then((m) => ({ default: m.AlertsPage })));
const SavedSearchesPage = lazy(() => import("./pages/app/SavedSearchesPage").then((m) => ({ default: m.SavedSearchesPage })));
const PaymentsPage = lazy(() => import("./pages/app/PaymentsPage").then((m) => ({ default: m.PaymentsPage })));
const AddPaymentMethodPage = lazy(() => import("./pages/app/AddPaymentMethodPage").then((m) => ({ default: m.AddPaymentMethodPage })));
// Admin pages
const ModerationListingsPage = lazy(() => import("./pages/admin/ModerationListingsPage").then((m) => ({ default: m.ModerationListingsPage })));
const ModerationReportsPage = lazy(() => import("./pages/admin/ModerationReportsPage").then((m) => ({ default: m.ModerationReportsPage })));
const PrescreenPage = lazy(() => import("./pages/admin/PrescreenPage").then((m) => ({ default: m.PrescreenPage })));
const BlogAdminPage = lazy(() => import("./pages/admin/BlogAdminPage").then((m) => ({ default: m.BlogAdminPage })));

// Shared pages
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

export function App() {
  return (
    <HelmetProvider>
      <Providers>
        <ErrorBoundary>
          <Suspense fallback={<PageSpinner />}>
            <Routes>
            {/* ── Public routes ── */}
            <Route element={<PublicLayout />}>
              <Route index element={<RouteBoundary><LandingPage /></RouteBoundary>} />
              <Route path="discover" element={<RouteBoundary><DiscoverPage /></RouteBoundary>} />
              <Route path="discover/:id" element={<RouteBoundary><ListingDetailPage /></RouteBoundary>} />
              <Route path="share/:id" element={<RouteBoundary><SharePage /></RouteBoundary>} />
              <Route path="search" element={<RouteBoundary><SearchPage /></RouteBoundary>} />
              <Route path="search/semantic" element={<RouteBoundary><SemanticSearchPage /></RouteBoundary>} />
              <Route path="cities/:slug" element={<RouteBoundary><CityPage /></RouteBoundary>} />
              <Route path="cities/:slug/:neighborhood" element={<RouteBoundary><NeighborhoodPage /></RouteBoundary>} />
              <Route path="blog" element={<RouteBoundary><BlogPage /></RouteBoundary>} />
              <Route path="blog/:slug" element={<RouteBoundary><BlogPostPage /></RouteBoundary>} />
              <Route path="blog/preview/:token" element={<RouteBoundary><BlogPreviewPage previewMode={true} /></RouteBoundary>} />
              <Route path="compare/:slug" element={<RouteBoundary><ComparisonPage /></RouteBoundary>} />
              <Route path="about" element={<RouteBoundary><AboutPage /></RouteBoundary>} />
              <Route path="terms" element={<RouteBoundary><TermsPage /></RouteBoundary>} />
              <Route path="privacy" element={<RouteBoundary><PrivacyPage /></RouteBoundary>} />
              <Route path="maintenance" element={<RouteBoundary><MaintenancePage /></RouteBoundary>} />
              <Route path="error" element={<RouteBoundary><ErrorPage /></RouteBoundary>} />
            </Route>

            {/* ── Auth routes ── */}
            <Route element={<AuthRedirectGuard />}>
              <Route element={<AuthLayout />}>
                <Route path="login" element={<RouteBoundary><LoginPage /></RouteBoundary>} />
                {/* Signup is unified into the login flow (it doubles as
                    signup for unknown identifiers); keep inbound links alive. */}
                <Route path="signup" element={<RouteBoundary><Navigate to="/login" replace /></RouteBoundary>} />
                <Route path="forgot-password" element={<RouteBoundary><ForgotPasswordPage /></RouteBoundary>} />
                <Route path="auth/callback" element={<RouteBoundary><AuthCallbackPage /></RouteBoundary>} />
              </Route>
            </Route>

            {/* ── Authenticated auth-flow routes (post-Google add-phone) ── */}
            <Route element={<AuthGuard />}>
              <Route element={<AuthLayout />}>
                <Route path="add-phone" element={<RouteBoundary><AddPhonePage /></RouteBoundary>} />
              </Route>
            </Route>

            {/* ── Authenticated app routes ── */}
            <Route element={<AuthGuard />}>
              <Route element={<GateGuard />}>
                <Route element={<AppLayout />}>
                <Route path="home" element={<RouteBoundary><HomePage /></RouteBoundary>} />
                <Route path="swipe" element={<RouteBoundary><SwipePage /></RouteBoundary>} />
                <Route path="likes" element={<RouteBoundary><LikesPage /></RouteBoundary>} />
                <Route path="matches" element={<RouteBoundary><MatchesPage /></RouteBoundary>} />
                <Route path="chats" element={<RouteBoundary><ChatsPage /></RouteBoundary>} />
                <Route path="chats/:id" element={<RouteBoundary><ChatDetailPage /></RouteBoundary>} />
                <Route path="explore" element={<RouteBoundary><ExplorePage /></RouteBoundary>} />
                <Route path="listing/:id" element={<RouteBoundary><ListingDetailPage /></RouteBoundary>} />
                <Route path="notifications" element={<RouteBoundary><NotificationsPage /></RouteBoundary>} />
                <Route path="profile" element={<RouteBoundary><ProfilePage /></RouteBoundary>} />
                <Route path="profile/edit" element={<RouteBoundary><ProfileEditPage /></RouteBoundary>} />
                <Route path="complete-profile" element={<RouteBoundary><Navigate to="/profile/edit" replace /></RouteBoundary>} />
                <Route path="profile/:id" element={<RouteBoundary><PublicProfilePage /></RouteBoundary>} />
                <Route path="settings" element={<RouteBoundary><SettingsPage /></RouteBoundary>} />
                <Route path="settings/appearance" element={<RouteBoundary><AppearancePage /></RouteBoundary>} />
                <Route path="settings/notifications" element={<RouteBoundary><SettingsNotificationsPage /></RouteBoundary>} />
                <Route path="settings/blocked-users" element={<RouteBoundary><BlockedUsersPage /></RouteBoundary>} />
                <Route path="settings/report-problem" element={<RouteBoundary><ReportProblemPage /></RouteBoundary>} />
                <Route path="post" element={<RouteBoundary><PostPage /></RouteBoundary>} />
                <Route path="post/review" element={<RouteBoundary><PostReviewPage /></RouteBoundary>} />
                <Route path="post/review/:listingId" element={<RouteBoundary><PostReviewPage /></RouteBoundary>} />
                <Route path="manage" element={<RouteBoundary><ManagePage /></RouteBoundary>} />
                <Route path="dashboard" element={<RouteBoundary><DashboardPage /></RouteBoundary>} />
                <Route path="dashboard/analytics" element={<RouteBoundary><AnalyticsPage /></RouteBoundary>} />
                <Route path="visits" element={<RouteBoundary><VisitsPage /></RouteBoundary>} />
                <Route path="visits/:id" element={<RouteBoundary><VisitDetailPage /></RouteBoundary>} />
                <Route path="compatibility/:id" element={<RouteBoundary><CompatibilityPage /></RouteBoundary>} />
                <Route path="my-listings/:id" element={<RouteBoundary><MyListingDetailPage /></RouteBoundary>} />
                <Route path="my-listings/:id/edit" element={<RouteBoundary><MyListingEditPage /></RouteBoundary>} />
                <Route path="choose-role" element={<RouteBoundary><ChooseRolePage /></RouteBoundary>} />
                <Route path="location" element={<RouteBoundary><LocationPage /></RouteBoundary>} />
                <Route path="onboarding" element={<RouteBoundary><OnboardingPage /></RouteBoundary>} />
                <Route path="onboarding/:step" element={<RouteBoundary><OnboardingStepPage /></RouteBoundary>} />
                <Route path="help" element={<RouteBoundary><HelpPage /></RouteBoundary>} />
                <Route path="alerts" element={<RouteBoundary><AlertsPage /></RouteBoundary>} />
                <Route path="saved-searches" element={<RouteBoundary><SavedSearchesPage /></RouteBoundary>} />
                <Route path="payments" element={<RouteBoundary><PaymentsPage /></RouteBoundary>} />
                <Route path="payments/new" element={<RouteBoundary><AddPaymentMethodPage /></RouteBoundary>} />
                </Route>
              </Route>
            </Route>

            {/* ── Admin routes ── */}
            <Route element={<AdminGuard />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/moderation/listings" replace />} />
                <Route path="moderation/listings" element={<RouteBoundary><ModerationListingsPage /></RouteBoundary>} />
                <Route path="moderation/reports" element={<RouteBoundary><ModerationReportsPage /></RouteBoundary>} />
                <Route path="moderation/prescreen" element={<RouteBoundary><ModerationListingsPage /></RouteBoundary>} />
                <Route path="moderation/prescreen/:id" element={<RouteBoundary><PrescreenPage /></RouteBoundary>} />
                <Route path="blog" element={<RouteBoundary><BlogAdminPage /></RouteBoundary>} />
              </Route>
            </Route>

            {/* ── Catch-all ── */}
            <Route path="*" element={<RouteBoundary><NotFoundPage /></RouteBoundary>} />
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </Providers>
    </HelmetProvider>
  );
}
