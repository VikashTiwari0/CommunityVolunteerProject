import React, { useEffect, useState } from "react";
import { api } from "../context/AuthContext";

const VolunteerManagement = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchVolunteers = async () => {
        try {
            const res = await api.get("/volunteers");
            setVolunteers(res.data.volunteers || []);
        } catch (err) {
            console.error("Fetch volunteers error:", err);
            setError("Failed to fetch volunteers roster");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVolunteers();
    }, []);

    const handleToggleVerification = async (volId, currentStatus) => {
        setError("");
        setSuccessMsg("");
        try {
            const res = await api.patch(`/volunteers/${volId}`, { isVerified: !currentStatus });
            if (res.data.success) {
                setSuccessMsg("Volunteer verification status updated successfully!");
                fetchVolunteers();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update volunteer status");
        }
    };

    const handleDeleteVolunteer = async (volId) => {
        if (!window.confirm("Are you sure you want to permanently delete this volunteer?")) return;
        setError("");
        setSuccessMsg("");
        try {
            const res = await api.delete(`/volunteers/${volId}`);
            if (res.data.success) {
                setSuccessMsg("Volunteer profile deleted successfully!");
                fetchVolunteers();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete volunteer");
        }
    };

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen py-10 px-6 md:px-12 md:pl-72 text-left">
            <div className="max-w-[1280px] mx-auto space-y-6">
                
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-extrabold text-[#0b1c30]">Volunteer Roster</h2>
                    <p className="text-sm text-[#434655] font-semibold mt-1">Review registrations, manage profiles, and verify social contributions.</p>
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

                {/* Volunteers Table */}
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004ac6] mx-auto"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {volunteers.length === 0 ? (
                            <p className="text-sm text-slate-500 py-12 text-center">No volunteers currently registered</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[#737686] font-bold uppercase text-xs">
                                            <th className="py-4 px-6">Avatar</th>
                                            <th className="py-4 px-6">Volunteer Profile</th>
                                            <th className="py-4 px-6">Location</th>
                                            <th className="py-4 px-6">Attributes</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                            <th className="py-4 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {volunteers.map((vol) => (
                                            <tr key={vol._id} className="hover:bg-slate-50/50">
                                                <td className="py-4 px-6">
                                                    <img 
                                                        src={vol.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                                                        alt="profile" 
                                                        className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                                                    />
                                                </td>
                                                <td className="py-4 px-6 text-left">
                                                    <p className="font-bold text-slate-800 text-base">{vol.name}</p>
                                                    <p className="text-xs text-slate-500 font-semibold">{vol.email}</p>
                                                    {vol.phone && <p className="text-xs text-slate-400 font-medium mt-0.5">{vol.phone}</p>}
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-700">{vol.location || "Not Provided"}</td>
                                                <td className="py-4 px-6 max-w-[240px]">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-slate-500 font-semibold"><span className="font-bold text-slate-700">Skills:</span> {vol.skills?.join(", ") || "None"}</p>
                                                        <p className="text-xs text-slate-500 font-semibold"><span className="font-bold text-slate-700">Interests:</span> {vol.interests?.join(", ") || "None"}</p>
                                                        <p className="text-xs text-slate-500 font-semibold"><span className="font-bold text-slate-700">Availability:</span> {vol.availability}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <button
                                                        onClick={() => handleToggleVerification(vol._id, vol.isVerified)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer border ${
                                                            vol.isVerified 
                                                                ? "bg-green-50 text-green-700 border-green-200" 
                                                                : "bg-red-50 text-red-700 border-red-200"
                                                        }`}
                                                    >
                                                        {vol.isVerified ? "Verified" : "Blocked"}
                                                    </button>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button 
                                                        onClick={() => handleDeleteVolunteer(vol._id)}
                                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                                                        title="Delete Volunteer"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
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
        </div>
    );
};

export default VolunteerManagement;
