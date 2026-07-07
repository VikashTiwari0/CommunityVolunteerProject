import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import Campaigns from "./pages/Campaigns";
import AIRecommendations from "./pages/AIRecommendations";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerManagement from "./pages/VolunteerManagement";
import CampaignManagement from "./pages/CampaignManagement";

const AppContent = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004ac6]"></div>
            </div>
        );
    }

    // Decide if header/sidebar should render
    const showHeader = user && location.pathname !== "/login" && location.pathname !== "/register";
    const showSidebar = user && user.role === "Admin" && location.pathname !== "/login" && location.pathname !== "/register";

    return (
        <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
            {/* Header navbar for logged in users */}
            {showHeader && <Navbar />}

            {/* Sidebar for NGO Admins */}
            {showSidebar && <Sidebar />}

            {/* Main Application Routes */}
            <div className="flex-grow">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={user ? <Navigate to={user.role === "Admin" ? "/admin/dashboard" : "/dashboard"} replace /> : <Login />} />
                    <Route path="/register" element={user ? <Navigate to={user.role === "Admin" ? "/admin/dashboard" : "/dashboard"} replace /> : <Register />} />

                    {/* Volunteer Protected Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["Volunteer"]}>
                                <VolunteerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/campaigns"
                        element={
                            <ProtectedRoute allowedRoles={["Volunteer"]}>
                                <Campaigns />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/ai-matching"
                        element={
                            <ProtectedRoute allowedRoles={["Volunteer"]}>
                                <AIRecommendations />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Protected Routes */}
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["Admin"]}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/volunteers"
                        element={
                            <ProtectedRoute allowedRoles={["Admin"]}>
                                <VolunteerManagement />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/campaigns"
                        element={
                            <ProtectedRoute allowedRoles={["Admin"]}>
                                <CampaignManagement />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback Redirects */}
                    <Route
                        path="/"
                        element={
                            user ? (
                                <Navigate to={user.role === "Admin" ? "/admin/dashboard" : "/dashboard"} replace />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
