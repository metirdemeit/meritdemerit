import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

// Import pages
import { LoginPage } from "../app/LoginPage";
// Admin pages
import { DashboardPage as AdminDashboardPage } from "../app/admin/DashboardPage";
import { CodesPages as AdminCodesPages } from "../app/admin/CodesPages";
import { SettingsPages as AdminSettingsPages } from "../app/admin/SettingsPages";
import { UsersPage as AdminUsersPage } from "../app/admin/UsersPage";
// Student pages
import { DashboardPage as StudentDashboardPage } from "../app/student/DashboardPage";
import { HistoryPages as StudentHistoryPages } from "../app/student/HistoryPages";

// Teacher pages
import { DashboardPage as TeacherDashboardPage } from "../app/teacher/DashboardPage";
import { StudentsPage as TeacherStudentsPage } from "../app/teacher/StudentsPage";
import { RulesPage as TeacherRulesPage } from "../app/teacher/RulesPage";

// Protected Route Component
export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={`/${user?.role}`} replace />;
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
    element: (
      <ProtectedRoute requiredRole="student">
        <StudentHistoryPages />
      </ProtectedRoute>
    ),
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
