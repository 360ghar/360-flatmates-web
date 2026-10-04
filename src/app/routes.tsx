import { Navigate, type RouteObject } from "react-router";
import { PageSpinner } from "@/components/ui/Spinner";
import type { RouteHandle } from "@/hooks/useRouteHandle";
import { AdminGuard, AuthGuard, AuthRedirectGuard, GateGuard } from "./guards";
import { AdaptiveLayout } from "./layouts/AdaptiveLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { AppLayout } from "./layouts/AppLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { FocusLayout } from "./layouts/FocusLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { RootLayout, RouteError } from "./RootLayout";

const h = (handle: RouteHandle) => ({ handle });

/** One error boundary per layout, so a page crash keeps the chrome around it. */
const boundary = (children: RouteObject[]): RouteObject => ({ errorElement: <RouteError />, children });

const publicRoutes: RouteObject[] = [
  { index: true, lazy: () => import("@/features/landing/pages/LandingPage").then((m) => ({ Component: m.LandingPage })) },
  { path: "share/:id", lazy: () => import("@/features/listings/pages/SharePage").then((m) => ({ Component: m.SharePage })) },
  { path: "cities/:slug", lazy: () => import("@/features/places/pages/CityPage").then((m) => ({ Component: m.CityPage })) },
  { path: "cities/:slug/:neighborhood", lazy: () => import("@/features/places/pages/NeighborhoodPage").then((m) => ({ Component: m.NeighborhoodPage })) },
  { path: "blog", lazy: () => import("@/features/blog/pages/BlogPage").then((m) => ({ Component: m.BlogPage })) },
  { path: "blog/:slug", lazy: () => import("@/features/blog/pages/BlogPostPage").then((m) => ({ Component: m.BlogPostPage })) },
  {
    path: "blog/preview/:token",
    lazy: () => import("@/features/blog/pages/DynamicBlogPostPage").then((m) => ({ element: <m.BlogPostPage previewMode /> }))
  },
  { path: "compare/:slug", lazy: () => import("@/features/places/pages/ComparisonPage").then((m) => ({ Component: m.ComparisonPage })) },
  { path: "about", lazy: () => import("@/features/company/pages/AboutPage").then((m) => ({ Component: m.AboutPage })) },
  { path: "terms", lazy: () => import("@/features/company/pages/TermsPage").then((m) => ({ Component: m.TermsPage })) },
  { path: "privacy", lazy: () => import("@/features/company/pages/PrivacyPage").then((m) => ({ Component: m.PrivacyPage })) },
  { path: "maintenance", lazy: () => import("@/features/system/pages/MaintenancePage").then((m) => ({ Component: m.MaintenancePage })) },
  { path: "error", lazy: () => import("@/features/system/pages/ErrorPage").then((m) => ({ Component: m.ErrorPage })) },
  { path: "*", lazy: () => import("@/features/system/pages/NotFoundPage").then((m) => ({ Component: m.NotFoundPage })) }
];

/* Shared with signed-in users: the app shell when signed in, the public
   header otherwise. Never guarded, so SEO pages and share links still work. */
const adaptiveRoutes: RouteObject[] = [
  { path: "discover", ...h({ title: "Browse rooms", navTab: "/explore" }), lazy: () => import("@/features/listings/pages/DiscoverPage").then((m) => ({ Component: m.DiscoverPage })) },
  { path: "discover/:id", ...h({ title: "Listing", navTab: "/explore", back: "/discover" }), lazy: () => import("@/features/listings/pages/ListingDetailPage").then((m) => ({ Component: m.ListingDetailPage })) },
  { path: "search", ...h({ title: "Search", navTab: "/explore" }), lazy: () => import("@/features/listings/pages/SearchPage").then((m) => ({ Component: m.SearchPage })) },
  { path: "search/semantic", ...h({ title: "Describe your home", navTab: "/explore", back: "/search" }), lazy: () => import("@/features/listings/pages/SemanticSearchPage").then((m) => ({ Component: m.SemanticSearchPage })) }
];

const authRoutes: RouteObject[] = [
  { path: "login", lazy: () => import("@/features/auth/pages/LoginPage").then((m) => ({ Component: m.LoginPage })) },
  // Signup is unified into the login flow; keep inbound links alive.
  { path: "signup", element: <Navigate to="/login" replace /> },
  { path: "forgot-password", lazy: () => import("@/features/auth/pages/ForgotPasswordPage").then((m) => ({ Component: m.ForgotPasswordPage })) },
  { path: "auth/callback", lazy: () => import("@/features/auth/pages/AuthCallbackPage").then((m) => ({ Component: m.AuthCallbackPage })) }
];

const appRoutes: RouteObject[] = [
  { path: "home", ...h({ title: "Home" }), lazy: () => import("@/features/home/pages/HomePage").then((m) => ({ Component: m.HomePage })) },
  { path: "swipe", ...h({ title: "Swipe" }), lazy: () => import("@/features/swipe/pages/SwipePage").then((m) => ({ Component: m.SwipePage })) },
  { path: "likes", ...h({ title: "Likes" }), lazy: () => import("@/features/matches/pages/LikesPage").then((m) => ({ Component: m.LikesPage })) },
  { path: "matches", ...h({ title: "Matches", navTab: "/likes", back: "/likes" }), lazy: () => import("@/features/matches/pages/MatchesPage").then((m) => ({ Component: m.MatchesPage })) },
  {
    path: "chats",
    ...h({ title: "Chats" }),
    lazy: () => import("@/features/chat/pages/ChatsPage").then((m) => ({ Component: m.ChatsPage })),
    children: [
      { path: ":id", ...h({ title: "Chat", navTab: "/chats", back: "/chats" }), lazy: () => import("@/features/chat/pages/ChatDetailPage").then((m) => ({ Component: m.ChatDetailPage })) }
    ]
  },
  { path: "explore", ...h({ title: "Explore" }), lazy: () => import("@/features/explore/pages/ExplorePage").then((m) => ({ Component: m.ExplorePage })) },
  { path: "listing/:id", ...h({ title: "Listing", navTab: "/explore", back: "/explore" }), lazy: () => import("@/features/listings/pages/ListingDetailPage").then((m) => ({ Component: m.ListingDetailPage })) },
  { path: "notifications", ...h({ title: "Notifications", back: "/home" }), lazy: () => import("@/features/notifications/pages/NotificationsPage").then((m) => ({ Component: m.NotificationsPage })) },
  { path: "profile", ...h({ title: "Profile" }), lazy: () => import("@/features/profile/pages/ProfilePage").then((m) => ({ Component: m.ProfilePage })) },
  { path: "profile/edit", ...h({ title: "Edit profile", navTab: "/profile", back: "/profile" }), lazy: () => import("@/features/profile/pages/ProfileEditPage").then((m) => ({ Component: m.ProfileEditPage })) },
  { path: "complete-profile", element: <Navigate to="/profile/edit" replace /> },
  { path: "profile/:id", ...h({ title: "Profile", navTab: "/likes", back: "/likes" }), lazy: () => import("@/features/profile/pages/PublicProfilePage").then((m) => ({ Component: m.PublicProfilePage })) },
  { path: "settings", element: <Navigate to="/profile" replace /> },
  { path: "settings/appearance", ...h({ title: "Appearance", navTab: "/profile", back: "/profile" }), lazy: () => import("@/features/settings/pages/AppearancePage").then((m) => ({ Component: m.AppearancePage })) },
  { path: "settings/notifications", ...h({ title: "Notification settings", navTab: "/profile", back: "/profile" }), lazy: () => import("@/features/settings/pages/SettingsNotificationsPage").then((m) => ({ Component: m.SettingsNotificationsPage })) },
  { path: "settings/blocked-users", ...h({ title: "Blocked users", navTab: "/profile", back: "/profile" }), lazy: () => import("@/features/settings/pages/BlockedUsersPage").then((m) => ({ Component: m.BlockedUsersPage })) },
  { path: "settings/report-problem", ...h({ title: "Report a problem", navTab: "/profile", back: "/profile" }), lazy: () => import("@/features/settings/pages/ReportProblemPage").then((m) => ({ Component: m.ReportProblemPage })) },
  { path: "manage", ...h({ title: "Your listings" }), lazy: () => import("@/features/hosting/pages/ManagePage").then((m) => ({ Component: m.ManagePage })) },
  { path: "dashboard", ...h({ title: "Dashboard" }), lazy: () => import("@/features/hosting/pages/DashboardPage").then((m) => ({ Component: m.DashboardPage })) },
  { path: "dashboard/analytics", ...h({ title: "Listing analytics", navTab: "/dashboard", back: "/dashboard" }), lazy: () => import("@/features/hosting/pages/AnalyticsPage").then((m) => ({ Component: m.AnalyticsPage })) },
  { path: "visits", ...h({ title: "Visits" }), lazy: () => import("@/features/visits/pages/VisitsPage").then((m) => ({ Component: m.VisitsPage })) },
  { path: "visits/:id", ...h({ title: "Visit details", navTab: "/visits", back: "/visits" }), lazy: () => import("@/features/visits/pages/VisitDetailPage").then((m) => ({ Component: m.VisitDetailPage })) },
  { path: "compatibility/:id", ...h({ title: "Compatibility", navTab: "/likes", back: "/likes" }), lazy: () => import("@/features/profile/pages/CompatibilityPage").then((m) => ({ Component: m.CompatibilityPage })) },
  { path: "my-listings/:id", ...h({ title: "Your listing", navTab: "/manage", back: "/manage" }), lazy: () => import("@/features/hosting/pages/MyListingDetailPage").then((m) => ({ Component: m.MyListingDetailPage })) },
  { path: "my-listings/:id/edit", ...h({ title: "Edit listing", navTab: "/manage", back: "/manage" }), lazy: () => import("@/features/hosting/pages/MyListingEditPage").then((m) => ({ Component: m.MyListingEditPage })) },
  { path: "help", ...h({ title: "Help", navTab: "/profile", back: "/profile" }), lazy: () => import("@/features/settings/pages/HelpPage").then((m) => ({ Component: m.HelpPage })) },
  { path: "alerts", ...h({ title: "Search alerts" }), lazy: () => import("@/features/alerts/pages/AlertsPage").then((m) => ({ Component: m.AlertsPage })) },
  { path: "saved-searches", ...h({ title: "Saved searches" }), lazy: () => import("@/features/alerts/pages/SavedSearchesPage").then((m) => ({ Component: m.SavedSearchesPage })) },
  { path: "payments", ...h({ title: "Payment methods", navTab: "/profile", back: "/profile" }), lazy: () => import("@/features/settings/pages/PaymentsPage").then((m) => ({ Component: m.PaymentsPage })) },
  { path: "payments/new", ...h({ title: "Add payment method", navTab: "/profile", back: "/payments" }), lazy: () => import("@/features/settings/pages/AddPaymentMethodPage").then((m) => ({ Component: m.AddPaymentMethodPage })) }
];

const focusRoutes: RouteObject[] = [
  { path: "post", ...h({ title: "Post a listing", navTab: "/manage", back: "/manage" }), lazy: () => import("@/features/hosting/pages/PostPage").then((m) => ({ Component: m.PostPage })) },
  { path: "post/review", ...h({ title: "Listing submitted", navTab: "/manage", back: "/manage" }), lazy: () => import("@/features/hosting/pages/PostReviewPage").then((m) => ({ Component: m.PostReviewPage })) },
  { path: "post/review/:listingId", ...h({ title: "Listing submitted", navTab: "/manage", back: "/manage" }), lazy: () => import("@/features/hosting/pages/PostReviewPage").then((m) => ({ Component: m.PostReviewPage })) },
  { path: "choose-role", ...h({ title: "How you use 360", navTab: "/profile", back: "/profile" }), lazy: () => import("@/features/onboarding/pages/ChooseRolePage").then((m) => ({ Component: m.ChooseRolePage })) },
  { path: "location", ...h({ title: "Your location", navTab: "/profile", back: "/profile" }), lazy: () => import("@/features/onboarding/pages/LocationPage").then((m) => ({ Component: m.LocationPage })) },
  { path: "onboarding", ...h({ title: "Welcome" }), lazy: () => import("@/features/onboarding/pages/OnboardingPage").then((m) => ({ Component: m.OnboardingPage })) },
  { path: "onboarding/:step", ...h({ title: "Welcome" }), lazy: () => import("@/features/onboarding/pages/OnboardingPage").then((m) => ({ Component: m.OnboardingPage })) }
];

const adminRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/admin/moderation/listings" replace /> },
  { path: "moderation/listings", ...h({ title: "Listing queue" }), lazy: () => import("@/features/admin/pages/ModerationListingsPage").then((m) => ({ Component: m.ModerationListingsPage })) },
  { path: "moderation/reports", ...h({ title: "Reports" }), lazy: () => import("@/features/admin/pages/ModerationReportsPage").then((m) => ({ Component: m.ModerationReportsPage })) },
  { path: "moderation/prescreen", element: <Navigate to="/admin/moderation/listings" replace /> },
  { path: "moderation/prescreen/:id", ...h({ title: "Prescreen", back: "/admin/moderation/listings" }), lazy: () => import("@/features/admin/pages/PrescreenPage").then((m) => ({ Component: m.PrescreenPage })) },
  { path: "blog", ...h({ title: "Blog" }), lazy: () => import("@/features/blog/pages/BlogAdminPage").then((m) => ({ Component: m.BlogAdminPage })) }
];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageSpinner />,
    children: [
      { element: <AdaptiveLayout />, children: [boundary(adaptiveRoutes)] },
      { element: <AuthRedirectGuard />, children: [{ element: <AuthLayout />, children: [boundary(authRoutes)] }] },
      {
        element: <AuthGuard />,
        children: [
          // Post-Google add-phone step.
          { element: <AuthLayout />, children: [boundary([{ path: "add-phone", lazy: () => import("@/features/auth/pages/AddPhonePage").then((m) => ({ Component: m.AddPhonePage })) }])] },
          {
            element: <GateGuard />,
            children: [
              { element: <AppLayout />, children: [boundary(appRoutes)] },
              { element: <FocusLayout />, children: [boundary(focusRoutes)] }
            ]
          }
        ]
      },
      { element: <AdminGuard />, children: [{ path: "admin", element: <AdminLayout />, children: [boundary(adminRoutes)] }] },
      // Last, so its "*" catch-all only takes what no other branch matched.
      { element: <PublicLayout />, children: [boundary(publicRoutes)] }
    ]
  }
];
