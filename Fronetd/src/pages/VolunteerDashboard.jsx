import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

const VolunteerDashboard = () => {
    const { user, updateProfile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [registrations, setRegistrations] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit Profile Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [profileLocation, setProfileLocation] = useState("");
    const [availability, setAvailability] = useState("Weekends");
    const [photo, setPhoto] = useState("");
    const [photoFile, setPhotoFile] = useState(null);
    const [skills, setSkills] = useState("");
    const [interests, setInterests] = useState("");
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");

    // Initialize edit form when opening modal
    const openEditModal = () => {
        setName(user?.name || "");
        setPhone(user?.phone || "");
        setProfileLocation(user?.location || "");
        setAvailability(user?.availability || "Weekends");
        setPhoto(user?.photo === "https://cdn-icons-png.flaticon.com/512/149/149071.png" ? "" : user?.photo || "");
        setPhotoFile(null);
        setSkills(user?.skills?.join(", ") || "");
        setInterests(user?.interests?.join(", ") || "");
        setEditError("");
        setEditSuccess("");
        setShowEditModal(true);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setEditError("");
        setEditSuccess("");

        const skillsArr = skills.split(",").map(s => s.trim()).filter(Boolean);
        const interestsArr = interests.split(",").map(i => i.trim()).filter(Boolean);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("phone", phone);
        formData.append("location", profileLocation);
        formData.append("availability", availability);
        formData.append("skills", JSON.stringify(skillsArr));
        formData.append("interests", JSON.stringify(interestsArr));

        if (photoFile) {
            formData.append("photo", photoFile);
        } else {
            formData.append("photo", photo);
        }

        const res = await updateProfile(formData);

        if (res.success) {
            setEditSuccess("Profile updated successfully!");
            setTimeout(() => {
                setShowEditModal(false);
            }, 1000);
        } else {
            setEditError(res.message || "Failed to update profile.");
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [regRes, certRes] = await Promise.all([
                    api.get("/campaigns/my/registrations"),
                    api.get("/certificates/me")
                ]);
                setRegistrations(regRes.data.registrations || []);
                setCertificates(certRes.data.certificates || []);
            } catch (err) {
                console.error("Fetch dashboard data failed:", err);
                setError("Failed to fetch dashboard metrics");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Listen for URL query search parameters to trigger edit profile modal
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get("edit") === "true") {
            openEditModal();
            // Clear the query parameter from the URL so page refreshes don't reopen it
            navigate("/dashboard", { replace: true });
        }
    }, [location.search, user, navigate]);

    // Calculate total hours volunteered
    const totalHours = certificates.reduce((sum, cert) => sum + cert.hours, 0);
    const monthlyGoal = 50;
    const progressPercent = Math.min(Math.round((totalHours / monthlyGoal) * 100), 100);

    // Calculate progress stroke dashoffset
    // Total circumference for radius 80 is 2 * pi * 80 = 502.65
    const strokeCircumference = 502.65;
    const strokeDashoffset = strokeCircumference - (progressPercent / 100) * strokeCircumference;

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen py-10 px-6 md:px-12">
            <div className="max-w-[1280px] mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
                    <div>
                        <p className="text-[#004ac6] font-bold text-xs uppercase tracking-wider mb-1">Volunteer Dashboard</p>
                        <h1 className="text-4xl font-extrabold text-[#0b1c30]">Welcome back, {user?.name}</h1>
                        <p className="text-[#434655] text-lg mt-1">
                            {progressPercent >= 100 
                                ? "Incredible! You've achieved your monthly volunteering goal. 🏆" 
                                : `You've reached ${progressPercent}% of your monthly volunteering goal. Keep it up!`}
                        </p>
                    </div>
                    <Link
                        to="/campaigns"
                        className="bg-[#004ac6] hover:bg-[#2563eb] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm self-start md:self-end"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Find New Campaigns
                    </Link>
                </header>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-semibold text-left">
                        {error}
                    </div>
                )}

                {/* Bento Grid */}
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004ac6] mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        
                        {/* Left Column: Stats & QR Code */}
                        <div className="md:col-span-4 space-y-6">
                            
                            {/* Profile Card */}
                            <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm text-left">
                                <div 
                                    onClick={openEditModal}
                                    className="flex items-center gap-4 mb-4 cursor-pointer hover:opacity-85 transition-opacity"
                                    title="Edit Profile"
                                >
                                    <img 
                                        src={user?.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt="profile" 
                                        className="w-16 h-16 rounded-full border border-slate-200 object-cover"
                                    />
                                    <div>
                                        <h3 className="font-extrabold text-lg text-slate-800 leading-snug">{user?.name}</h3>
                                        <p className="text-xs text-slate-500 font-semibold">{user?.location || "Location not provided"}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                                    <p className="text-slate-600"><span className="font-bold text-slate-800">Phone:</span> {user?.phone || "None"}</p>
                                    <p className="text-slate-600"><span className="font-bold text-slate-800">Availability:</span> {user?.availability}</p>
                                    <p className="text-slate-600"><span className="font-bold text-slate-800">Skills:</span> {user?.skills?.join(", ") || "None"}</p>
                                    <p className="text-slate-600"><span className="font-bold text-slate-800">Interests:</span> {user?.interests?.join(", ") || "None"}</p>
                                </div>
                                <button 
                                    onClick={openEditModal}
                                    className="mt-4 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#004ac6] py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    Edit Profile
                                </button>
                            </section>

                            {/* Progress Ring Card */}
                            <section className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center">
                                <h3 className="font-bold text-lg text-[#0b1c30] mb-6 w-full text-left">Volunteer Hours</h3>
                                <div className="relative flex items-center justify-center mb-6">
                                    <svg className="w-48 h-48">
                                        <circle 
                                            className="text-slate-100 stroke-current" 
                                            cx="96" 
                                            cy="96" 
                                            fill="transparent" 
                                            r="80" 
                                            strokeWidth="12"
                                        ></circle>
                                        <circle 
                                            className="text-[#004ac6] stroke-current transition-all duration-500 origin-center -rotate-90" 
                                            cx="96" 
                                            cy="96" 
                                            fill="transparent" 
                                            r="80" 
                                            strokeLinecap="round" 
                                            strokeWidth="12" 
                                            style={{
                                                strokeDasharray: strokeCircumference,
                                                strokeDashoffset: strokeDashoffset
                                            }}
                                        ></circle>
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-4xl font-extrabold text-[#0b1c30]">{totalHours}h</span>
                                        <span className="text-xs text-[#737686] font-semibold mt-1">Hours this month</span>
                                    </div>
                                </div>
                                <div className="w-full flex justify-between items-center text-sm py-2 border-t border-slate-100 font-semibold">
                                    <span className="text-[#434655]">Monthly Goal: {monthlyGoal}h</span>
                                    {totalHours < monthlyGoal ? (
                                        <span className="text-[#006c49] font-bold">{monthlyGoal - totalHours}h to go</span>
                                    ) : (
                                        <span className="text-[#006c49] font-bold">Goal Met! 🎉</span>
                                    )}
                                </div>
                            </section>

                            {/* Volunteer QR Check-in Display */}
                            <section className="bg-[#2563eb] text-white rounded-xl p-8 shadow-lg relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
                                <div className="relative z-10 flex flex-col items-center gap-4">
                                    {/* Mock QR Code containing user's MongoDB ID */}
                                    <div className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${user?._id}`}
                                            alt="Attendance QR Code"
                                            className="w-32 h-32"
                                        />
                                        <span className="text-[10px] text-[#434655] font-bold mt-2">VOLUNTEER ID: {user?._id?.substring(18)}</span>
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-xl font-bold mb-1">Your Attendance QR</h4>
                                        <p className="text-white/80 text-xs font-semibold leading-relaxed">Present this QR Code to campaign coordinators at event arrival to log your hours instantly.</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Campaigns, Milestones & Certificates */}
                        <div className="md:col-span-8 space-y-6">
                            
                            {/* Upcoming / Active Campaigns */}
                            <section className="text-left">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-xl text-[#0b1c30]">Registered Campaigns</h3>
                                    <Link to="/campaigns" className="text-[#004ac6] text-sm font-semibold hover:underline">Browse All</Link>
                                </div>

                                {registrations.length === 0 ? (
                                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-[#737686]">
                                        <span className="material-symbols-outlined text-4xl mb-2 text-[#c3c6d7]">campaign</span>
                                        <p className="text-sm font-medium">You haven't registered for any campaigns yet.</p>
                                        <Link to="/campaigns" className="text-[#004ac6] text-xs font-bold hover:underline block mt-2">Register Now</Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {registrations.slice(0, 4).map((reg) => {
                                            const camp = reg.campaignId;
                                            if (!camp) return null;
                                            return (
                                                <div key={reg._id} className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-shadow duration-200 group">
                                                    <div className="p-5 space-y-4">
                                                        <div className="flex justify-between items-start gap-2 w-full">
                                                             <div className="flex flex-col gap-1 text-left">
                                                                 <span className="bg-[#eff4ff] text-[#004ac6] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit">
                                                                     {camp.category}
                                                                 </span>
                                                                 <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide w-fit ${
                                                                     camp.status === "Completed"
                                                                         ? "bg-slate-100 text-slate-600 border border-slate-200"
                                                                         : camp.status === "Active"
                                                                         ? "bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse"
                                                                         : "bg-blue-50 text-blue-700 border border-blue-100"
                                                                 }`}>
                                                                     {camp.status || "Upcoming"}
                                                                 </span>
                                                             </div>
                                                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                 reg.status === "Accepted" 
                                                                     ? "bg-green-50 text-green-700 border border-green-200" 
                                                                     : reg.status === "Rejected"
                                                                     ? "bg-red-50 text-red-700 border-red-200"
                                                                     : "bg-amber-50 text-amber-700 border border-amber-200"
                                                             }`}>
                                                                 {reg.status}
                                                             </span>
                                                         </div>
                                                        <div>
                                                            <h4 className="font-extrabold text-md text-[#0b1c30] group-hover:text-[#004ac6] transition-colors line-clamp-1">{camp.title}</h4>
                                                            <p className="text-xs text-[#434655] font-semibold mt-1 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                                {camp.location}
                                                            </p>
                                                            <p className="text-xs text-[#737686] font-semibold mt-1 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                                {new Date(camp.date).toLocaleDateString()} at {camp.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            {/* Certificates Section */}
                            <section className="text-left">
                                <h3 className="font-bold text-xl text-[#0b1c30] mb-4">Earned Certificates</h3>
                                {certificates.length === 0 ? (
                                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-[#737686]">
                                        <span className="material-symbols-outlined text-4xl mb-2 text-[#c3c6d7]">workspace_premium</span>
                                        <p className="text-sm font-medium">Your earned certificates will appear here once events are completed.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                                        {certificates.map((cert) => (
                                            <div key={cert._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                                                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-[#0b1c30] text-sm leading-snug">{cert.campaignId?.title || "Campaign"}</h4>
                                                        <p className="text-xs text-[#737686] font-semibold mt-0.5">
                                                            {cert.hours} Hours • Issued {new Date(cert.issuedDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`http://localhost:5000${cert.pdfUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full sm:w-auto px-4 py-2 border border-[#c3c6d7] hover:bg-slate-50 text-[#0b1c30] font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">download</span>
                                                    Download PDF
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Milestones / Badge Gallery */}
                            <section className="bg-[#e5eeff] rounded-xl p-6 border border-[#c3c6d7] text-left">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg text-[#0b1c30]">Impact Milestones</h3>
                                    <span className="text-[#004ac6] text-xs font-bold uppercase tracking-wider">
                                        {totalHours >= 100 ? "4" : totalHours >= 50 ? "3" : totalHours >= 20 ? "2" : totalHours >= 5 ? "1" : "0"} Badges Earned
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-6">
                                    {/* Century Club */}
                                    <div className={`flex flex-col items-center gap-2 group cursor-help transition-opacity duration-300 ${totalHours < 100 ? "opacity-30" : "opacity-100"}`}>
                                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shadow-sm group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">Century Club</span>
                                    </div>

                                    {/* Hours Hero */}
                                    <div className={`flex flex-col items-center gap-2 group cursor-help transition-opacity duration-300 ${totalHours < 50 ? "opacity-30" : "opacity-100"}`}>
                                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 shadow-sm group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">50h Hero</span>
                                    </div>

                                    {/* Active Contributor */}
                                    <div className={`flex flex-col items-center gap-2 group cursor-help transition-opacity duration-300 ${totalHours < 20 ? "opacity-30" : "opacity-100"}`}>
                                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shadow-sm group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">Active Duty</span>
                                    </div>

                                    {/* Initiated */}
                                    <div className={`flex flex-col items-center gap-2 group cursor-help transition-opacity duration-300 ${totalHours < 5 ? "opacity-30" : "opacity-100"}`}>
                                        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">First Impact</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative overflow-hidden border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#004ac6] text-2xl">edit_square</span>
                                <h3 className="font-bold text-lg text-[#0b1c30]">Update Profile Details</h3>
                            </div>
                            <button 
                                onClick={() => setShowEditModal(false)} 
                                className="material-symbols-outlined text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                            >
                                close
                            </button>
                        </div>

                        {editError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                                {editError}
                            </div>
                        )}
                        {editSuccess && (
                            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-xs font-semibold">
                                {editSuccess}
                            </div>
                        )}

                        <form onSubmit={handleProfileSubmit} className="space-y-4 text-left max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        className="w-full bg-slate-50 border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                                    <input 
                                        type="text" 
                                        value={phone} 
                                        onChange={(e) => setPhone(e.target.value)} 
                                        className="w-full bg-slate-50 border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Location (City, State)</label>
                                    <input 
                                        type="text" 
                                        value={profileLocation} 
                                        onChange={(e) => setProfileLocation(e.target.value)} 
                                        className="w-full bg-slate-50 border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Availability</label>
                                    <select 
                                        value={availability} 
                                        onChange={(e) => setAvailability(e.target.value)} 
                                        className="w-full bg-slate-50 border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                                    >
                                        <option value="Weekends">Weekends</option>
                                        <option value="Weekdays">Weekdays</option>
                                        <option value="Full-time">Full-time</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Profile Photo</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setPhotoFile(e.target.files[0]);
                                            }
                                        }}
                                        id="photo-file-upload"
                                        className="hidden"
                                    />
                                    <label 
                                        htmlFor="photo-file-upload"
                                        className="bg-slate-50 hover:bg-slate-100 border border-dashed border-[#c3c6d7] rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer text-slate-600 flex items-center gap-2 hover:border-[#004ac6] transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                        {photoFile ? photoFile.name : "Choose Profile Image"}
                                    </label>
                                    {photoFile && (
                                        <button 
                                            type="button" 
                                            onClick={() => setPhotoFile(null)}
                                            className="text-red-500 text-xs font-bold hover:underline cursor-pointer"
                                        >
                                            Clear File
                                        </button>
                                    )}
                                    {user?.photo && user.photo !== "https://cdn-icons-png.flaticon.com/512/149/149071.png" && !photoFile && (
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setPhoto(""); // Send empty photo string to reset to default in DB
                                                alert("Click Save Changes below to apply reset.");
                                            }}
                                            className="text-amber-600 text-xs font-bold hover:underline cursor-pointer"
                                        >
                                            Reset to Default
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Skills (comma separated)</label>
                                <input 
                                    type="text" 
                                    value={skills} 
                                    onChange={(e) => setSkills(e.target.value)} 
                                    placeholder="First Aid, Teaching, Coding"
                                    className="w-full bg-slate-50 border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Interests (comma separated)</label>
                                <input 
                                    type="text" 
                                    value={interests} 
                                    onChange={(e) => setInterests(e.target.value)} 
                                    placeholder="Healthcare, Education, Animals"
                                    className="w-full bg-slate-50 border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => setShowEditModal(false)}
                                    className="px-5 py-2.5 border border-[#c3c6d7] text-[#0b1c30] text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2.5 bg-[#004ac6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VolunteerDashboard;
