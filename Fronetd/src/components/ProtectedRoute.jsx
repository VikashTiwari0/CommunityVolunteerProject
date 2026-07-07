import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div class="min-h-screen flex items-center justify-center bg-surface">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to dashboard if wrong role
        return <Navigate to={user.role === "Admin" ? "/admin/dashboard" : "/dashboard"} replace />;
    }

    return children;
};

export default ProtectedRoute;
