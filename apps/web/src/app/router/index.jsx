import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { ProtectedRoute, RoleHomeRedirect } from "../../shared/ui/RouteGuards";
import { LoginPage } from "../../features/auth/LoginPage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { ProfilePage } from "../../features/profile/ProfilePage";
import { NotificationsPage } from "../../features/notifications/NotificationsPage";
import { DrivesPage } from "../../features/drives/DrivesPage";
import { CompaniesPage } from "../../features/companies/CompaniesPage";
import { ApplicationsPage } from "../../features/applications/ApplicationsPage";
import { RoundsPage } from "../../features/rounds/RoundsPage";
import { OffersPage } from "../../features/offers/OffersPage";
import { ResumesPage } from "../../features/resumes/ResumesPage";
import { AnalyticsPage } from "../../features/analytics/AnalyticsPage";
import { DepartmentAnalyticsPage } from "../../features/analytics/DepartmentAnalyticsPage";
import { CreateDrivePage } from "../../features/drives/CreateDrivePage";
import { MyDrivesPage } from "../../features/drives/MyDrivesPage";
import { CheckDrivesPage } from "../../features/drives/CheckDrivesPage";
import { MenteesPage } from "../../features/faculty/MenteesPage";
import { StudentPortalPage } from "../../features/student/StudentPortalPage";
import { RecruiterPortalPage } from "../../features/recruiter/RecruiterPortalPage";
import { RecruiterInterviewsPageLive as RecruiterInterviewsPage } from "../../features/recruiter/RecruiterInterviewsPageLive";
import { RecruiterCommunicationsPageLive as RecruiterCommunicationsPage } from "../../features/recruiter/RecruiterCommunicationsPageLive";
import { RecruiterReportsPageLive as RecruiterReportsPage } from "../../features/recruiter/RecruiterReportsPageLive";
import { RecruiterCandidatePageLive as RecruiterCandidatePage } from "../../features/recruiter/RecruiterCandidatePageLive";
import { FacultyPortalPage } from "../../features/faculty/FacultyPortalPage";
import { AdminPortalPage } from "../../features/admin/AdminPortalPage";
import { AdminDashboardPageLive as AdminDashboardPage } from "../../features/admin/AdminDashboardPageLive";
import { AdminUsersPage } from "../../features/admin/AdminUsersPage";
import { AdminUserDetailsPage } from "../../features/admin/AdminUserDetailsPage";
import { AdminRolesPage } from "../../features/admin/AdminRolesPage";
import { AdminLogsPage } from "../../features/admin/AdminLogsPage";
import { AdminDrivesPage } from "../../features/admin/AdminDrivesPage";
import { AdminReportsPage } from "../../features/admin/AdminReportsPage";
import { TpoPortalPage } from "../../features/tpo/TpoPortalPage";
import { TpoDashboardPageLive as TpoDashboardPage } from "../../features/tpo/TpoDashboardPageLive";
import { TpoDrivesPage } from "../../features/tpo/TpoDrivesPage";
import { TpoDriveDetailsPage } from "../../features/tpo/TpoDriveDetailsPage";
import { TpoStudentsPage } from "../../features/tpo/TpoStudentsPage";
import { TpoStudentDetailsPage } from "../../features/tpo/TpoStudentDetailsPage";
import { TpoApplicationsPage } from "../../features/tpo/TpoApplicationsPage";
import { TpoOffersPage } from "../../features/tpo/TpoOffersPage";
import { TpoPlacementsPage } from "../../features/tpo/TpoPlacementsPage";
import { TpoAnalyticsPage } from "../../features/tpo/TpoAnalyticsPage";
import { TpoReportsPage } from "../../features/tpo/TpoReportsPage";
import { TpoAnnouncementsPage } from "../../features/tpo/TpoAnnouncementsPage";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { UnauthorizedPage } from "../../pages/UnauthorizedPage";
import { ErrorPage } from "../../pages/ErrorPage";
import { RequireRole } from "../../shared/ui/RouteGuards";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [{ path: "login", element: <LoginPage /> }]
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "drives", element: <DrivesPage /> },
      { path: "companies", element: <CompaniesPage /> },
      { path: "applications", element: <ApplicationsPage /> },
      { path: "rounds", element: <RoundsPage /> },
      { path: "offers", element: <OffersPage /> },
      { path: "resumes", element: <ResumesPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "analytics/department", element: <DepartmentAnalyticsPage /> },
      { path: "drives/create", element: <CreateDrivePage /> },
      { path: "drives/mine", element: <MyDrivesPage /> },
      { path: "drives/review", element: <CheckDrivesPage /> },
      { path: "mentees", element: <MenteesPage /> },
      {
        path: "student",
        element: (
          <RequireRole roles={["STUDENT"]}>
            <StudentPortalPage />
          </RequireRole>
        )
      },
      {
        path: "recruiter",
        element: (
          <RequireRole roles={["RECRUITER"]}>
            <RecruiterPortalPage />
          </RequireRole>
        )
      },
      {
        path: "recruiter/interviews",
        element: (
          <RequireRole roles={["RECRUITER"]}>
            <RecruiterInterviewsPage />
          </RequireRole>
        )
      },
      {
        path: "recruiter/communications",
        element: (
          <RequireRole roles={["RECRUITER"]}>
            <RecruiterCommunicationsPage />
          </RequireRole>
        )
      },
      {
        path: "recruiter/reports",
        element: (
          <RequireRole roles={["RECRUITER"]}>
            <RecruiterReportsPage />
          </RequireRole>
        )
      },
      {
        path: "recruiter/candidates/:candidateId",
        element: (
          <RequireRole roles={["RECRUITER"]}>
            <RecruiterCandidatePage />
          </RequireRole>
        )
      },
      {
        path: "faculty",
        element: (
          <RequireRole roles={["FACULTY"]}>
            <FacultyPortalPage />
          </RequireRole>
        )
      },
      {
        path: "admin",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminPortalPage />
          </RequireRole>
        )
      },
      {
        path: "admin/dashboard",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminDashboardPage />
          </RequireRole>
        )
      },
      {
        path: "admin/users",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminUsersPage />
          </RequireRole>
        )
      },
      {
        path: "admin/users/:id",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminUserDetailsPage />
          </RequireRole>
        )
      },
      {
        path: "admin/roles",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminRolesPage />
          </RequireRole>
        )
      },
      {
        path: "admin/logs",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminLogsPage />
          </RequireRole>
        )
      },
      {
        path: "admin/drives",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminDrivesPage />
          </RequireRole>
        )
      },
      {
        path: "admin/reports",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminReportsPage />
          </RequireRole>
        )
      },
      {
        path: "tpo",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoPortalPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/dashboard",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoDashboardPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/drives",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoDrivesPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/drives/:id",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoDriveDetailsPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/students",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoStudentsPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/students/:id",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoStudentDetailsPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/applications",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoApplicationsPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/offers",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoOffersPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/placements",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoPlacementsPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/analytics",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoAnalyticsPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/reports",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoReportsPage />
          </RequireRole>
        )
      },
      {
        path: "tpo/announcements",
        element: (
          <RequireRole roles={["TPO"]}>
            <TpoAnnouncementsPage />
          </RequireRole>
        )
      },
      { path: "home", element: <RoleHomeRedirect /> }
    ]
  },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "*", element: <NotFoundPage /> }
]);
