import { Suspense, lazy, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRoutes, Navigate } from "react-router-dom";

import LoadingScreen from "@/components/LoadingScreen";
import { DEFAULT_AUTH, DEFAULT_DOCS, DEFAULT_PATH } from "@/config";
import { PATH_DASHBOARD } from "@/routes/paths";
import DashboardLayout from "@/layouts/dashboard";
import StaffOnly from "@/layouts/admin/StaffOnly";
import AuthLayout from "@/layouts/auth";
import DocsLayout from "@/layouts/docs";
import { isApp } from "@/utils/platform";

const Loadable = (Component) => (props) => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Component {...props} />
    </Suspense>
  );
};

// a tab fetched ahead of time renders at once, so a slide into it never shows the loading screen
const preloadable = (load) => {
  const LazyPage = Loadable(lazy(load));
  let LoadedPage = null;
  const Page = (props) => {
    const [ReadyPage] = useState(() => LoadedPage ?? LazyPage);
    return <ReadyPage {...props} />;
  };
  Page.preload = () => load().then((module) => (LoadedPage = module.default));
  return Page;
};

const TAB_PRELOAD_DELAY_MS = 1500;

export default function Router() {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const timer = setTimeout(() => [ChatPage, StatusPage, ContactsPage, Settings].forEach((page) => page.preload()), TAB_PRELOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  return useRoutes([
    {
      path: "/auth",
      element: <AuthLayout />,
      children: [
        { element: <Navigate to={DEFAULT_AUTH} replace />, index: true },
        { path: "welcome", element: isApp ? <AppTourPage /> : <WelcomePage /> },
        { path: "login", element: <LoginPage /> },
        { path: "register", element: <RegisterPage /> },
        { path: "verify", element: <VerifyPage /> },
        { path: "forgot-password", element: <ForgotPasswordPage /> },
        { path: "reset-password", element: <ResetPasswordPage /> },
      ],
    },
    {
      path: "/docs",
      element: <DocsLayout />,
      children: [
        { element: <Navigate to={DEFAULT_DOCS} replace />, index: true },
        { path: "tnc", element: <TnCPage /> },
        { path: "privacy", element: <PrivacyPage /> },
        { path: "delete-account", element: <DeleteAccountPage /> },
        { path: "child-safety", element: <ChildSafetyPage /> },
      ],
    },
    { path: "/welcome", element: <Navigate to={DEFAULT_AUTH} replace /> },
    {
      path: "/admin",
      element: <StaffOnly />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            // the layout matches /admin only through a child, and sends each person on to the first page they can use
            { index: true, element: null },
            { path: "overview", element: <OverviewPage /> },
            { path: "people", element: <PeoplePage /> },
            { path: "reports", element: <ReportsPage /> },
            { path: "requests", element: <GameRequestsPage /> },
            { path: "audit", element: <AuditLogPage /> },
            { path: "team", element: <TeamPage /> },
            { path: "*", element: <Navigate to="/404" replace /> },
          ],
        },
      ],
    },
    { path: "/setup", element: <SetupPage /> },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        { element: <Navigate to={DEFAULT_PATH} replace />, index: true },
        { path: "chat/*", element: <ChatPage /> },
        { path: "app", element: <Navigate to={DEFAULT_PATH} replace /> },
        { path: "status", element: <StatusPage /> },
        { path: "profile", element: <Navigate to={PATH_DASHBOARD.general.profile} replace /> },
        { path: "contacts/*", element: <ContactsPage /> },
        { path: "contact", element: <Navigate to={PATH_DASHBOARD.general.contacts} replace /> },
        { path: "settings/*", element: <Settings /> },

        { path: "404", element: <Page404 /> },
        { path: "*", element: <Navigate to="/404" replace /> },
      ],
    },
    { path: "*", element: <Navigate to="/404" replace /> },
  ]);
}
// app pages
const ChatPage = preloadable(() => import("@/pages/dashboard/Chat"));
const StatusPage = preloadable(() => import("@/pages/dashboard/Status"));
const ContactsPage = preloadable(() => import("@/pages/dashboard/Contacts"));
const SetupPage = Loadable(lazy(() => import("@/pages/Setup")));
const Settings = preloadable(() => import("@/pages/dashboard/Settings"));

// auth pages
const WelcomePage = Loadable(lazy(() => import("@/pages/auth/WelcomePage")));
const AppTourPage = Loadable(lazy(() => import("@/pages/auth/AppTour")));
const LoginPage = Loadable(lazy(() => import("@/pages/auth/Login")));
const RegisterPage = Loadable(lazy(() => import("@/pages/auth/Register")));
const VerifyPage = Loadable(lazy(() => import("@/pages/auth/Verify")));
const ForgotPasswordPage = Loadable(lazy(() => import("@/pages/auth/ForgotPassword")));
const ResetPasswordPage = Loadable(lazy(() => import("@/pages/auth/ResetPassword")));

// admin pages, fetched only once the guard has let someone through
const AdminLayout = Loadable(lazy(() => import("@/layouts/admin")));
const OverviewPage = Loadable(lazy(() => import("@/pages/admin/Overview")));
const PeoplePage = Loadable(lazy(() => import("@/pages/admin/People")));
const ReportsPage = Loadable(lazy(() => import("@/pages/admin/Reports")));
const GameRequestsPage = Loadable(lazy(() => import("@/pages/admin/GameRequests")));
const AuditLogPage = Loadable(lazy(() => import("@/pages/admin/AuditLog")));
const TeamPage = Loadable(lazy(() => import("@/pages/admin/Team")));

// docs pages
const TnCPage = Loadable(lazy(() => import("@/pages/docs/TnC")));
const PrivacyPage = Loadable(lazy(() => import("@/pages/docs/Privacy")));
const DeleteAccountPage = Loadable(lazy(() => import("@/pages/docs/DeleteAccount")));
const ChildSafetyPage = Loadable(lazy(() => import("@/pages/docs/ChildSafety")));

const Page404 = Loadable(lazy(() => import("@/pages/404")));
