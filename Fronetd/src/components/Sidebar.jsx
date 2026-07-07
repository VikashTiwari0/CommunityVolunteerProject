import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    if (!user || user.role !== "Admin") return null;

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-white border-r border-slate-200 py-6 px-4 z-50">
            {/* Brand Header */}
            <div className="mb-10 px-2 pt-2 text-left">
                <h1 className="font-extrabold text-2xl text-[#004ac6] cursor-pointer" onClick={() => navigate("/admin/dashboard")}>
                    Admin Portal
                </h1>
                <p className="text-xs font-semibold text-[#737686] uppercase tracking-wider mt-1">UnityVolunteer Central</p>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 space-y-1">
                <Link
                    to="/admin/dashboard"
                    className={`flex items-center gap-3 px-3 py-3 font-semibold rounded-lg transition-all active:scale-95 duration-150 ${
                        isActive("/admin/dashboard")
                            ? "bg-[#e5eeff] text-[#004ac6]"
                            : "text-[#434655] hover:bg-slate-50"
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">dashboard</span>
                    <span className="text-sm">Admin Dashboard</span>
                </Link>

                <Link
                    to="/admin/volunteers"
                    className={`flex items-center gap-3 px-3 py-3 font-semibold rounded-lg transition-all active:scale-95 duration-150 ${
                        isActive("/admin/volunteers")
                            ? "bg-[#e5eeff] text-[#004ac6]"
                            : "text-[#434655] hover:bg-slate-50"
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">group</span>
                    <span className="text-sm">Volunteer Roster</span>
                </Link>

                <Link
                    to="/admin/campaigns"
                    className={`flex items-center gap-3 px-3 py-3 font-semibold rounded-lg transition-all active:scale-95 duration-150 ${
                        isActive("/admin/campaigns")
                            ? "bg-[#e5eeff] text-[#004ac6]"
                            : "text-[#434655] hover:bg-slate-50"
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">campaign</span>
                    <span className="text-sm">Campaign Manager</span>
                </Link>
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto space-y-4 pt-4 border-t border-slate-200">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-3 text-red-600 font-semibold hover:bg-red-50 rounded-lg transition-all active:scale-95 duration-150 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span className="text-sm">Log Out</span>
                </button>

                {/* Profile Card */}
                <div className="flex items-center gap-3 px-2 py-3 bg-slate-50 rounded-xl">
                    <img
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        src={user.photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"}
                        alt="Admin Profile"
                    />
                    <div className="overflow-hidden text-left">
                        <p className="text-sm font-bold text-[#0b1c30] truncate">{user.name}</p>
                        <p className="text-[10px] font-semibold text-[#737686] uppercase truncate">Head of Operations</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
