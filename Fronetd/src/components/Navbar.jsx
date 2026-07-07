import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, api } from "../context/AuthContext";
import QRScanner from "./QRScanner";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Local states for QR features
    const [showScanner, setShowScanner] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [isError, setIsError] = useState(false);

    if (!user) return null;

    const isActive = (path) => location.pathname === path;

    // Handles the Admin scanning a Volunteer's QR code
    const handleAdminScan = async (scannedVolunteerId) => {
        setIsError(false);
        setAlertMessage("");
        try {
            // Send the scanned volunteer ID to the backend to mark attendance
            const res = await api.post("/attendance/scan", { volunteerId: scannedVolunteerId });
            if (res.data.success) {
                setIsError(false);
                setAlertMessage(`Success! Attendance marked for ${res.data.attendance?.volunteer?.name || "volunteer"}.`);
            }
        } catch (err) {
            console.error("QR mark attendance failed:", err);
            setIsError(true);
            setAlertMessage(err.response?.data?.message || "Failed to mark attendance.");
        }
    };

    const handleQrButtonClick = () => {
        setAlertMessage("");
        setIsError(false);
        if (user.role === "Admin") {
            setShowScanner(true);
        } else {
            setShowQR(true);
        }
    };

    return (
        <>
            <nav className="flex justify-between items-center px-6 md:px-12 h-16 w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-8">
                    <span 
                        className="font-extrabold text-2xl text-[#004ac6] cursor-pointer"
                        onClick={() => navigate(user.role === "Admin" ? "/admin/dashboard" : "/dashboard")}
                    >
                        UnityVolunteer
                    </span>
                    
                    {/* Volunteer Links (Admin has Sidebar) */}
                    {user.role === "Volunteer" && (
                        <div className="hidden md:flex gap-6">
                            <Link 
                                to="/dashboard" 
                                className={`font-semibold text-sm transition-colors hover:text-[#004ac6] ${
                                    isActive("/dashboard") ? "text-[#004ac6] border-b-2 border-[#004ac6] pb-1" : "text-[#434655]"
                                }`}
                            >
                                Dashboard
                            </Link>
                            <Link 
                                to="/campaigns" 
                                className={`font-semibold text-sm transition-colors hover:text-[#004ac6] ${
                                    isActive("/campaigns") ? "text-[#004ac6] border-b-2 border-[#004ac6] pb-1" : "text-[#434655]"
                                }`}
                            >
                                Campaigns
                            </Link>
                            <Link 
                                to="/ai-matching" 
                                className={`font-semibold text-sm transition-colors hover:text-[#004ac6] ${
                                    isActive("/ai-matching") ? "text-[#004ac6] border-b-2 border-[#004ac6] pb-1" : "text-[#434655]"
                                }`}
                            >
                                AI Matching
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* QR Code Icon Shortcut */}
                    <button 
                        onClick={handleQrButtonClick}
                        title={user.role === "Admin" ? "Scan Volunteer QR Code" : "Show My Check-in QR Code"}
                        className="material-symbols-outlined text-[#434655] hover:bg-slate-100 p-2 rounded-full transition-colors active:scale-95 cursor-pointer"
                    >
                        {user.role === "Admin" ? "qr_code_scanner" : "qr_code"}
                    </button>

                    <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-3">
                        <div 
                            onClick={() => { navigate(user.role === "Admin" ? "/admin/dashboard?edit=true" : "/dashboard?edit=true"); }}
                            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
                            title="Edit Profile"
                        >
                            <img 
                                className="w-10 h-10 rounded-full border-2 border-[#e5eeff] object-cover" 
                                src={user.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                                alt="User Profile"
                            />
                            <div className="hidden sm:flex flex-col text-left">
                                <p className="font-bold text-sm text-[#0b1c30] leading-tight">{user.name}</p>
                                <p className="text-xs text-[#434655] capitalize">{user.role}</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={logout}
                            title="Logout"
                            className="material-symbols-outlined text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors active:scale-95 ml-2 cursor-pointer"
                        >
                            logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Admin Camera Scanner Modal */}
            {showScanner && user.role === "Admin" && (
                <div className="relative z-50">
                    <QRScanner 
                        onClose={() => setShowScanner(false)} 
                        onScanSuccess={handleAdminScan} 
                    />
                    {alertMessage && (
                        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg text-white font-bold text-xs max-w-sm z-50 animate-bounce ${
                            isError ? "bg-red-600" : "bg-green-600"
                        }`}>
                            {alertMessage}
                        </div>
                    )}
                </div>
            )}

            {/* Volunteer Personal QR Display Modal */}
            {showQR && user.role === "Volunteer" && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative overflow-hidden border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#004ac6] text-2xl">qr_code</span>
                                <h3 className="font-bold text-lg text-[#0b1c30]">My Check-in Pass</h3>
                            </div>
                            <button 
                                onClick={() => setShowQR(false)} 
                                className="material-symbols-outlined text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                            >
                                close
                            </button>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl flex items-center justify-center border border-slate-100 mb-4">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${user._id}`} 
                                alt="Volunteer checkin QR"
                                className="w-[220px] h-[220px] shadow-sm rounded bg-white p-2"
                            />
                        </div>

                        <div className="text-center text-xs space-y-1.5 leading-relaxed text-[#737686]">
                            <p className="font-extrabold text-[#0b1c30] text-sm">{user.name}</p>
                            <p className="font-semibold text-slate-700">Present this QR code to the campaign Admin at the site to check in and record your volunteer hours.</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
