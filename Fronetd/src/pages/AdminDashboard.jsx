import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import QRScanner from "../components/QRScanner";

const AdminDashboard = () => {
    const { user, updateProfile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [volunteers, setVolunteers] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Create Campaign Form State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [newLoc, setNewLoc] = useState("");
    const [newMax, setNewMax] = useState(10);
    const [newCat, setNewCat] = useState("Healthcare");
    const [newSkills, setNewSkills] = useState("");
    const [campaignImageFile, setCampaignImageFile] = useState(null);
    const [newImage, setNewImage] = useState("");
    // QR Scanner States
    const [showScanner, setShowScanner] = useState(false);
    const [selectedCampaignForAttendance, setSelectedCampaignForAttendance] = useState("");

    // Certificate Generation Modal States
    const [showCertModal, setShowCertModal] = useState(false);
    const [certVolunteer, setCertVolunteer] = useState("");
    const [certCampaign, setCertCampaign] = useState("");
    const [certHours, setCertHours] = useState(5);

    // Admin Edit Profile Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [locationName, setLocationName] = useState("");
    const [photo, setPhoto] = useState("");
    const [photoFile, setPhotoFile] = useState(null);
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");

    const openEditModal = () => {
        setName(user?.name || "");
        setPhone(user?.phone || "");
        setLocationName(user?.location || "");
        setPhoto(user?.photo === "https://cdn-icons-png.flaticon.com/512/149/149071.png" ? "" : user?.photo || "");
        setPhotoFile(null);
        setEditError("");
        setEditSuccess("");
        setShowEditModal(true);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setEditError("");
        setEditSuccess("");

        const formData = new FormData();
        formData.append("name", name);
        formData.append("phone", phone);
        formData.append("location", locationName);

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

    const fetchData = async () => {
        try {
            const [volRes, campRes] = await Promise.all([
                api.get("/volunteers"),
                api.get("/campaigns")
            ]);
            setVolunteers(volRes.data.volunteers || []);
            setCampaigns(campRes.data.campaigns || []);

            // For each campaign, fetch its registrations
            const allRegs = [];
            for (let camp of campRes.data.campaigns) {
                const regRes = await api.get(`/campaigns/${camp._id}/volunteers`);
                if (regRes.data.success) {
                    allRegs.push(...regRes.data.registrations.map(r => ({ ...r, campaignTitle: camp.title })));
                }
            }
            setRegistrations(allRegs);
        } catch (err) {
            console.error("Fetch admin data error:", err);
            setError("Failed to load administration roster");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Listen for URL query search parameters to trigger edit profile modal
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get("edit") === "true") {
            openEditModal();
            // Clear the query parameter from the URL so page refreshes don't reopen it
            navigate("/admin/dashboard", { replace: true });
        }
    }, [location.search, user, navigate]);

    // Create Campaign Handler
    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        const skills = newSkills.split(",").map(s => s.trim()).filter(Boolean);

        try {
            const formData = new FormData();
            formData.append("title", newTitle);
            formData.append("description", newDesc);
            formData.append("date", newDate);
            formData.append("time", newTime);
            formData.append("location", newLoc);
            formData.append("maxVolunteers", Number(newMax));
            formData.append("category", newCat);
            formData.append("skillsRequired", JSON.stringify(skills));

            if (campaignImageFile) {
                formData.append("image", campaignImageFile);
            } else if (newImage) {
                formData.append("image", newImage);
            }

            const res = await api.post("/campaigns", formData);

            if (res.data.success) {
                setSuccessMsg("Campaign created and WebSocket announcement broadcasted!");
                setShowCreateModal(false);
                // Clear inputs
                setNewTitle("");
                setNewDesc("");
                setNewDate("");
                setNewTime("");
                setNewLoc("");
                setNewMax(10);
                setNewSkills("");
                setCampaignImageFile(null);
                setNewImage("");
                fetchData();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create campaign");
        }
    };

    // Registration Approval Handler
    const handleUpdateRegistration = async (campaignId, volunteerId, status) => {
        setError("");
        setSuccessMsg("");
        try {
            const res = await api.patch(`/campaigns/${campaignId}/volunteers/${volunteerId}`, { status });
            if (res.data.success) {
                setSuccessMsg(`Successfully marked volunteer as ${status}`);
                fetchData();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update registration status");
        }
    };

    // Verify / Block Volunteer account toggle
    const handleToggleVerification = async (volId, currentStatus) => {
        setError("");
        setSuccessMsg("");
        try {
            const res = await api.patch(`/volunteers/${volId}`, { isVerified: !currentStatus });
            if (res.data.success) {
                setSuccessMsg(`Volunteer account verification updated`);
                fetchData();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to change verification status");
        }
    };

    // QR Scan Attendance Success Handler
    const handleQRScanSuccess = async (scannedVolunteerId) => {
        setShowScanner(false);
        setError("");
        setSuccessMsg("");

        if (!selectedCampaignForAttendance) {
            setError("Please select a target campaign first before scanning");
            return;
        }

        try {
            const res = await api.post("/attendance", {
                volunteerId: scannedVolunteerId,
                campaignId: selectedCampaignForAttendance,
                status: "Present"
            });
            if (res.data.success) {
                setSuccessMsg(`Checked in volunteer successfully!`);
                fetchData();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Check-in failed. Verify registration status.");
        }
    };

    // Generate Certificate Handler
    const handleGenerateCertificate = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        try {
            const res = await api.post("/certificates/generate", {
                volunteerId: certVolunteer,
                campaignId: certCampaign,
                hours: Number(certHours)
            });
            if (res.data.success) {
                setSuccessMsg("Certificate generated, saved, and email notification queued!");
                setShowCertModal(false);
                fetchData();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to generate certificate");
        }
    };

    // Completed Campaigns calculation
    const activeCampaigns = campaigns.filter(c => c.status !== "Completed" && c.status !== "Cancelled").length;
    const completedCampaigns = campaigns.filter(c => c.status === "Completed").length;

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen py-10 px-6 md:px-12 md:pl-72 text-left">
            <div className="max-w-[1280px] mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-[#0b1c30]">NGO Admin Dashboard</h2>
                        <p className="text-sm text-[#434655] font-semibold mt-1">Welcome back, Head of Operations. Central control panel.</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#004ac6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            New Campaign
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-semibold">
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">
                        {successMsg}
                    </div>
                )}

                {/* Stat Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Volunteers */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between stat-card-gradient">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-[#004ac6] rounded-xl">
                                <span className="material-symbols-outlined">group</span>
                            </div>
                            <span className="text-[#006c49] font-bold text-xs bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">+12%</span>
                        </div>
                        <div>
                            <p className="text-[#434655] text-xs font-bold uppercase tracking-wider">Total Volunteers</p>
                            <h3 className="text-4xl font-extrabold text-[#0b1c30] mt-1">{volunteers.length}</h3>
                        </div>
                    </div>

                    {/* Active Campaigns */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between stat-card-gradient">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-50 text-[#006c49] rounded-xl">
                                <span className="material-symbols-outlined">campaign</span>
                            </div>
                            <span className="text-[#004ac6] font-bold text-xs bg-[#eff4ff] border border-[#c3c6d7] px-2 py-0.5 rounded-full">Ongoing</span>
                        </div>
                        <div>
                            <p className="text-[#434655] text-xs font-bold uppercase tracking-wider">Active Campaigns</p>
                            <h3 className="text-4xl font-extrabold text-[#0b1c30] mt-1">{activeCampaigns}</h3>
                        </div>
                    </div>

                    {/* Completed Campaigns */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between stat-card-gradient">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-50 text-[#784b00] rounded-xl">
                                <span className="material-symbols-outlined">task_alt</span>
                            </div>
                            <span className="text-slate-500 font-bold text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">Completed</span>
                        </div>
                        <div>
                            <p className="text-[#434655] text-xs font-bold uppercase tracking-wider">Completed Events</p>
                            <h3 className="text-4xl font-extrabold text-[#0b1c30] mt-1">{completedCampaigns}</h3>
                        </div>
                    </div>

                    {/* QR Quick Checkin */}
                    <div className="bg-[#004ac6] text-white p-6 rounded-2xl shadow-md flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                            <span className="text-xs font-bold bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full">Checkin Desk</span>
                        </div>
                        <div>
                            <select 
                                value={selectedCampaignForAttendance}
                                onChange={(e) => setSelectedCampaignForAttendance(e.target.value)}
                                className="w-full bg-[#2563eb] text-white border border-white/20 rounded px-2 py-1 text-xs mb-2 cursor-pointer focus:outline-none"
                            >
                                <option value="">Select Event...</option>
                                {campaigns.filter(c => c.status !== "Completed").map(c => (
                                    <option key={c._id} value={c._id}>{c.title}</option>
                                ))}
                            </select>
                            <button 
                                onClick={() => {
                                    if(!selectedCampaignForAttendance) {
                                        setError("Select an event first!");
                                        return;
                                    }
                                    setShowScanner(true);
                                }}
                                className="w-full bg-white text-[#004ac6] font-bold text-xs py-2 rounded shadow hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
                            >
                                Scan Volunteer QR
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Operations Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left: Pending Registrations List */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-extrabold text-lg text-[#0b1c30]">Campaign Enrollment Requests</h3>
                            <button 
                                onClick={() => {
                                    if(volunteers.length > 0 && campaigns.length > 0) {
                                        setCertVolunteer(volunteers[0]?._id);
                                        setCertCampaign(campaigns[0]?._id);
                                        setShowCertModal(true);
                                    }
                                }}
                                className="text-xs font-bold text-[#004ac6] hover:underline"
                            >
                                Generate Certificate Manually
                            </button>
                        </div>

                        {registrations.filter(r => r.status === "Pending").length === 0 ? (
                            <div className="py-12 text-center text-[#737686]">
                                <span className="material-symbols-outlined text-3xl mb-2 text-[#c3c6d7]">assignment_turned_in</span>
                                <p className="text-sm font-medium">All campaign registration requests have been processed.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[#737686] font-bold uppercase">
                                            <th className="py-3 px-2">Volunteer</th>
                                            <th className="py-3 px-2">Campaign</th>
                                            <th className="py-3 px-2">Details</th>
                                            <th className="py-3 px-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {registrations.filter(r => r.status === "Pending").map((reg) => (
                                            <tr key={reg._id} className="hover:bg-slate-50/50">
                                                <td className="py-4 px-2 font-bold text-slate-800">{reg.volunteerId?.name}</td>
                                                <td className="py-4 px-2 font-semibold text-[#004ac6]">{reg.campaignTitle}</td>
                                                <td className="py-4 px-2 text-slate-500 max-w-[150px] truncate">
                                                    Skills: {reg.volunteerId?.skills?.join(", ") || "None"}
                                                </td>
                                                <td className="py-4 px-2 text-right space-x-1 whitespace-nowrap">
                                                    <button 
                                                        onClick={() => handleUpdateRegistration(reg.campaignId, reg.volunteerId?._id, "Accepted")}
                                                        className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-bold rounded cursor-pointer"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateRegistration(reg.campaignId, reg.volunteerId?._id, "Rejected")}
                                                        className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-bold rounded cursor-pointer"
                                                    >
                                                        Reject
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Right: Volunteer Directory & Verification */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-extrabold text-lg text-[#0b1c30] mb-6">Verified Volunteers</h3>
                        {volunteers.length === 0 ? (
                            <p className="text-sm text-slate-500 py-6 text-center">No volunteers currently registered</p>
                        ) : (
                            <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                                {volunteers.map((vol) => (
                                    <div key={vol._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={vol.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                                                alt="Vol profile" 
                                                className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                                            />
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold text-slate-800 truncate">{vol.name}</p>
                                                <p className="text-xs text-[#737686] truncate">{vol.email}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleToggleVerification(vol._id, vol.isVerified)}
                                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                                                vol.isVerified 
                                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                                                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                            }`}
                                        >
                                            {vol.isVerified ? "Verified" : "Blocked"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL: Create Campaign */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-extrabold text-xl text-[#0b1c30]">Launch Social Campaign</h3>
                                <button onClick={() => setShowCreateModal(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-600 cursor-pointer">close</button>
                            </div>
                            <form className="space-y-4" onSubmit={handleCreateCampaign}>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Title</label>
                                    <input 
                                        type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="Beach Cleanup / Blood Donation"
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Description</label>
                                    <textarea 
                                        required value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                                        placeholder="Detailed explanation of campaign objective..." rows="3"
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                                        <input 
                                            type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                                        <input 
                                            type="text" required value={newTime} onChange={(e) => setNewTime(e.target.value)}
                                            placeholder="08:00 AM"
                                            className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                                        <input 
                                            type="text" required value={newLoc} onChange={(e) => setNewLoc(e.target.value)}
                                            placeholder="Marina Beach, Seattle"
                                            className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Max Volunteers</label>
                                        <input 
                                            type="number" required value={newMax} onChange={(e) => setNewMax(e.target.value)}
                                            className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                                        <select 
                                            value={newCat} onChange={(e) => setNewCat(e.target.value)}
                                            className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none cursor-pointer"
                                        >
                                            <option value="Healthcare">Healthcare</option>
                                            <option value="Environmental">Environmental</option>
                                            <option value="Education">Education</option>
                                            <option value="Food Security">Food Security</option>
                                            <option value="Social Services">Social Services</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Required Skills (commas)</label>
                                        <input 
                                            type="text" value={newSkills} onChange={(e) => setNewSkills(e.target.value)}
                                            placeholder="First Aid, Heavy Lifting"
                                            className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Cover Image</label>
                                    <div className="space-y-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg p-2.5">
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setCampaignImageFile(e.target.files[0]);
                                                    }
                                                }}
                                                id="campaign-file-upload"
                                                className="hidden"
                                            />
                                            <label 
                                                htmlFor="campaign-file-upload"
                                                className="bg-white border border-[#c3c6d7] rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer text-slate-600 flex items-center gap-1.5 hover:border-[#004ac6] transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">image</span>
                                                {campaignImageFile ? campaignImageFile.name : "Select Cover Image"}
                                            </label>
                                            {campaignImageFile && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => setCampaignImageFile(null)}
                                                    className="text-red-500 text-xs font-bold hover:underline cursor-pointer"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={newImage} 
                                            onChange={(e) => setNewImage(e.target.value)} 
                                            placeholder="Or paste cover image URL here..."
                                            disabled={!!campaignImageFile}
                                            className="w-full bg-white border border-[#c3c6d7] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#004ac6] disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full bg-[#004ac6] text-white py-3 rounded-xl font-bold hover:bg-[#2563eb] active:scale-95 transition-transform cursor-pointer mt-4"
                                >
                                    Publish & Notify Volunteers
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL: Generate Certificate */}
                {showCertModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-extrabold text-xl text-[#0b1c30]">Issue Appreciation Certificate</h3>
                                <button onClick={() => setShowCertModal(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-600 cursor-pointer">close</button>
                            </div>
                            <form className="space-y-4" onSubmit={handleGenerateCertificate}>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Volunteer</label>
                                    <select 
                                        value={certVolunteer} onChange={(e) => setCertVolunteer(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none cursor-pointer"
                                    >
                                        {volunteers.map(v => (
                                            <option key={v._id} value={v._id}>{v.name} ({v.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Campaign</label>
                                    <select 
                                        value={certCampaign} onChange={(e) => setCertCampaign(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none cursor-pointer"
                                    >
                                        {campaigns.map(c => (
                                            <option key={c._id} value={c._id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Volunteered Hours</label>
                                    <input 
                                        type="number" required value={certHours} onChange={(e) => setCertHours(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full bg-[#004ac6] text-white py-3 rounded-xl font-bold hover:bg-[#2563eb] active:scale-95 transition-transform cursor-pointer mt-4"
                                >
                                    Generate & Email PDF Certificate
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* QR Scanner Component */}
                {showScanner && (
                    <QRScanner 
                        onClose={() => setShowScanner(false)} 
                        onScanSuccess={handleQRScanSuccess} 
                    />
                )}
                {/* Edit Profile Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative overflow-hidden border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#004ac6] text-2xl">edit_square</span>
                                    <h3 className="font-bold text-lg text-[#0b1c30]">Update Admin Profile</h3>
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

                            <form onSubmit={handleProfileSubmit} className="space-y-4 text-left">
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

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Location</label>
                                    <input 
                                        type="text" 
                                        value={locationName} 
                                        onChange={(e) => setLocationName(e.target.value)} 
                                        className="w-full bg-slate-50 border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#004ac6]"
                                    />
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
                                            id="admin-photo-file-upload"
                                            className="hidden"
                                        />
                                        <label 
                                            htmlFor="admin-photo-file-upload"
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
        </div>
    );
};

export default AdminDashboard;
