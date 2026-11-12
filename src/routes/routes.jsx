import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

// Pages are loaded on demand: a student never downloads the admin screens.
const page = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const LoginPage = page(() => import("../app/LoginPage"), "LoginPage");
// Admin pages
const AdminDashboardPage = page(() => import("../app/admin/DashboardPage"), "DashboardPage");
const AdminCodesPages = page(() => import("../app/admin/CodesPages"), "CodesPages");
const AdminSettingsPages = page(() => import("../app/admin/SettingsPages"), "SettingsPages");
const AdminUsersPage = page(() => import("../app/admin/UsersPage"), "UsersPage");
const AdminRankingPage = page(() => import("../app/admin/RankingPage"), "RankingPage");
// Student pages
const StudentDashboardPage = page(() => import("../app/student/DashboardPage"), "DashboardPage");
// Teacher pages
const TeacherDashboardPage = page(() => import("../app/teacher/DashboardPage"), "DashboardPage");
const TeacherStudentsPage = page(() => import("../app/teacher/StudentsPage"), "StudentsPage");
const TeacherRulesPage = page(() => import("../app/teacher/RulesPage"), "RulesPage");

// Protected Route Component
export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole) {
    const isAllowed = user?.role === requiredRole || (requiredRole === "admin" && user?.role === "superadmin");
    if (!isAllowed) {
      return <Navigate to={`/${user?.role}`} replace />;
    }
  }
  
  return children;
};

// Login Route Component
const LoginRoute = () => {
  const { user } = useAuthStore();
  
  if (user) {
    return <Navigate to={`/${user?.role}`} replace />;
  }
  
  return <LoginPage />;
};

// Routes configuration
export const routes = [
  // Public Routes
  {
    path: "/login",
    element: <LoginRoute />,
    isPublic: true,
  },
  
  // Admin Routes
  {
    path: "/admin",
    element: <Navigate to="/admin/dashboard" replace />,
    requiredRole: "admin",
  },
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboardPage/>
      </ProtectedRoute>
    ),
    requiredRole: "admin",
  },
  {
    path: "/admin/codes",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminCodesPages />
      </ProtectedRoute>
    ),
    requiredRole: "admin",
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminUsersPage />
      </ProtectedRoute>
    ),
    requiredRole: "admin",
  },
  {
    path: "/admin/settings",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminSettingsPages />
      </ProtectedRoute>
    ),
    requiredRole: "admin",
  },
  {
    path: "/admin/ranking",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminRankingPage />
      </ProtectedRoute>
    ),
    requiredRole: "admin",
  },
  {
    path: "/ranking",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminRankingPage />
      </ProtectedRoute>
    ),
    requiredRole: "admin",
  },
  
  // Student Routes
  {
    path: "/student",
    element: <Navigate to="/student/dashboard" replace />,
    requiredRole: "student",
  },
  {
    path: "/student/dashboard",
    element: (
      <ProtectedRoute requiredRole="student">
        <StudentDashboardPage />
      </ProtectedRoute>
    ),
    requiredRole: "student",
  },
  {
    path: "/student/history",
    element: <Navigate to="/student/dashboard" replace />,
    requiredRole: "student",
  },
  
  // Teacher Routes
  {
    path: "/teacher",
    element: <Navigate to="/teacher/dashboard" replace />,
    requiredRole: "teacher",
  },
  {
    path: "/teacher/dashboard",
    element: (
      <ProtectedRoute requiredRole="teacher">
        <TeacherDashboardPage />
      </ProtectedRoute>
    ),
    requiredRole: "teacher",
  },
  {
    path: "/teacher/students",
    element: (
      <ProtectedRoute requiredRole="teacher">
        <TeacherStudentsPage />
      </ProtectedRoute>
    ),
    requiredRole: "teacher",
  },
  {
    path: "/teacher/rules",
    element: (
      <ProtectedRoute requiredRole="teacher">
        <TeacherRulesPage />
      </ProtectedRoute>
    ),
    requiredRole: "teacher",
  },
];

// Default Route Component
const DefaultRoute = () => {
  const { user } = useAuthStore();
  
  if (user) {
    return <Navigate to={`/${user?.role}`} replace />;
  }
  
  return <Navigate to="/login" replace />;
};

// Default route redirects
export const defaultRoutes = [
  {
    path: "/",
    element: <DefaultRoute />,
    isPublic: true,
  },
  {
    path: "*",
    element: <DefaultRoute />,
    isPublic: true,
  },
];

// Get route by role
export const getRouteByRole = (role) => {
  return `/${role}`;
};
