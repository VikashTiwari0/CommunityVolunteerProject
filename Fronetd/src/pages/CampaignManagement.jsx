import React, { useEffect, useState } from "react";
import { api } from "../context/AuthContext";
const CampaignManagement = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Edit Campaign modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCampId, setSelectedCampId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editTime, setEditTime] = useState("");
    const [editLoc, setEditLoc] = useState("");
    const [editMax, setEditMax] = useState(10);
    const [editCat, setEditCat] = useState("Healthcare");
    const [editSkills, setEditSkills] = useState("");
    const [editImageFile, setEditImageFile] = useState(null);
    const [editImageUrl, setEditImageUrl] = useState("");

    const fetchCampaigns = async () => {
        try {
            const res = await api.get("/campaigns");
            setCampaigns(res.data.campaigns || []);
        } catch (err) {
            console.error("Fetch campaigns error:", err);
            setError("Failed to fetch campaigns list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleUpdateStatus = async (campId, newStatus) => {
        setError("");
        setSuccessMsg("");
        try {
            const res = await api.patch(`/campaigns/${campId}`, { status: newStatus });
            if (res.data.success) {
                setSuccessMsg(`Campaign status updated to: ${newStatus}`);
                fetchCampaigns();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update campaign status");
        }
    };

    const handleDeleteCampaign = async (campId) => {
        if (!window.confirm("Are you sure you want to permanently delete this campaign? This will delete all associated registrations.")) return;
        setError("");
        setSuccessMsg("");
        try {
            const res = await api.delete(`/campaigns/${campId}`);
            if (res.data.success) {
                setSuccessMsg("Campaign deleted successfully!");
                fetchCampaigns();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete campaign");
        }
    };

    const openEditModal = (camp) => {
        setSelectedCampId(camp._id);
        setEditTitle(camp.title || "");
        setEditDesc(camp.description || "");
        
        if (camp.date) {
            const d = new Date(camp.date);
            const formattedDate = d.toISOString().split("T")[0];
            setEditDate(formattedDate);
        } else {
            setEditDate("");
        }
        
        setEditTime(camp.time || "");
        setEditLoc(camp.location || "");
        setEditMax(camp.maxVolunteers || 10);
        setEditCat(camp.category || "Healthcare");
        setEditSkills(camp.skillsRequired?.join(", ") || "");
        setEditImageFile(null);
        setEditImageUrl(camp.image || "");
        
        setError("");
        setSuccessMsg("");
        setShowEditModal(true);
    };

    const handleEditCampaignSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        const skillsArr = editSkills.split(",").map(s => s.trim()).filter(Boolean);

        try {
            const formData = new FormData();
            formData.append("title", editTitle);
            formData.append("description", editDesc);
            formData.append("date", editDate);
            formData.append("time", editTime);
            formData.append("location", editLoc);
            formData.append("maxVolunteers", Number(editMax));
            formData.append("category", editCat);
            formData.append("skillsRequired", JSON.stringify(skillsArr));

            if (editImageFile) {
                formData.append("image", editImageFile);
            } else {
                formData.append("image", editImageUrl);
            }

            const res = await api.patch(`/campaigns/${selectedCampId}`, formData);

            if (res.data.success) {
                setSuccessMsg("Campaign updated successfully!");
                setShowEditModal(false);
                fetchCampaigns();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update campaign details");
        }
    };

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen py-10 px-6 md:px-12 md:pl-72 text-left">
            <div className="max-w-[1280px] mx-auto space-y-6">
                
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-extrabold text-[#0b1c30]">Campaign Manager</h2>
                    <p className="text-sm text-[#434655] font-semibold mt-1">Deploy, monitor, and finalize community social campaigns.</p>
                </div>

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

                {/* Campaigns Table */}
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004ac6] mx-auto"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {campaigns.length === 0 ? (
                            <p className="text-sm text-slate-500 py-12 text-center">No campaigns currently deployed</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[#737686] font-bold uppercase text-xs">
                                            <th className="py-4 px-6">Campaign Info</th>
                                            <th className="py-4 px-6">Category</th>
                                            <th className="py-4 px-6">Location</th>
                                            <th className="py-4 px-6">Date & Time</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                            <th className="py-4 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {campaigns.map((camp) => (
                                            <tr key={camp._id} className="hover:bg-slate-50/50">
                                                <td className="py-4 px-6 text-left">
                                                    <p className="font-bold text-slate-800 text-base">{camp.title}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{camp.description}</p>
                                                    {camp.skillsRequired?.length > 0 && (
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                            Skills: {camp.skillsRequired.join(", ")}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="bg-[#eff4ff] text-[#004ac6] px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide">
                                                        {camp.category}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-700">{camp.location}</td>
                                                <td className="py-4 px-6 text-slate-600 font-medium">
                                                    <p>{new Date(camp.date).toLocaleDateString()}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{camp.time}</p>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                        camp.status === "Completed" 
                                                            ? "bg-green-50 text-green-700 border border-green-200" 
                                                            : camp.status === "Cancelled"
                                                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                                                            : camp.status === "Active"
                                                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                                    }`}>
                                                        {camp.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {camp.status !== "Completed" && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(camp._id, "Active")}
                                                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs rounded cursor-pointer"
                                                                >
                                                                    Activate
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(camp._id, "Completed")}
                                                                    className="px-2 py-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold text-xs rounded cursor-pointer"
                                                                >
                                                                    Complete
                                                                </button>
                                                            </>
                                                        )}
                                                         <button 
                                                             onClick={() => openEditModal(camp)}
                                                             className="text-[#004ac6] hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors cursor-pointer"
                                                             title="Edit Campaign Details"
                                                         >
                                                             <span className="material-symbols-outlined text-[20px]">edit</span>
                                                         </button>
                                                         <button 
                                                             onClick={() => handleDeleteCampaign(camp._id)}
                                                             className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                                                             title="Delete Campaign"
                                                         >
                                                             <span className="material-symbols-outlined text-[20px]">delete</span>
                                                         </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL: Edit Campaign */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-extrabold text-xl text-[#0b1c30]">Update Campaign Details</h3>
                            <button onClick={() => setShowEditModal(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-600 cursor-pointer">close</button>
                        </div>
                        <form className="space-y-4" onSubmit={handleEditCampaignSubmit}>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Title</label>
                                <input 
                                    type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none text-[#0b1c30]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Description</label>
                                <textarea 
                                    required value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none text-[#0b1c30]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                                    <input 
                                        type="date" required value={editDate} onChange={(e) => setEditDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none text-[#0b1c30]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                                    <input 
                                        type="text" required value={editTime} onChange={(e) => setEditTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none text-[#0b1c30]"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                                    <input 
                                        type="text" required value={editLoc} onChange={(e) => setEditLoc(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none text-[#0b1c30]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Max Volunteers</label>
                                    <input 
                                        type="number" required value={editMax} onChange={(e) => setEditMax(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none text-[#0b1c30]"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                                    <select 
                                        value={editCat} onChange={(e) => setEditCat(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none cursor-pointer text-[#0b1c30]"
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
                                        type="text" value={editSkills} onChange={(e) => setEditSkills(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm outline-none text-[#0b1c30]"
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
                                                    setEditImageFile(e.target.files[0]);
                                                }
                                            }}
                                            id="edit-campaign-file-upload"
                                            className="hidden"
                                        />
                                        <label 
                                            htmlFor="edit-campaign-file-upload"
                                            className="bg-white border border-[#c3c6d7] rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer text-slate-600 flex items-center gap-1.5 hover:border-[#004ac6] transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">image</span>
                                            {editImageFile ? editImageFile.name : "Select Cover Image"}
                                        </label>
                                        {editImageFile && (
                                            <button 
                                                type="button" 
                                                onClick={() => setEditImageFile(null)}
                                                className="text-red-500 text-xs font-bold hover:underline cursor-pointer"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={editImageUrl} 
                                        onChange={(e) => setEditImageUrl(e.target.value)} 
                                        placeholder="Or paste cover image URL here..."
                                        disabled={!!editImageFile}
                                        className="w-full bg-white border border-[#c3c6d7] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#004ac6] disabled:opacity-50 text-[#0b1c30]"
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-[#004ac6] text-white py-3 rounded-xl font-bold hover:bg-[#2563eb] active:scale-95 transition-transform cursor-pointer mt-4"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignManagement;
