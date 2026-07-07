import React, { useEffect, useState } from "react";
import { api } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import MapComponent from "../components/MapComponent";

const Campaigns = () => {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtering States
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");
    const [locationFilter, setLocationFilter] = useState("All Locations");
    
    // Map Active Focus State
    const [activeLocationName, setActiveLocationName] = useState("San Francisco, CA");
    const [showMap, setShowMap] = useState(false);

    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchData = async () => {
        try {
            const [campsRes, regsRes] = await Promise.all([
                api.get("/campaigns"),
                api.get("/campaigns/my/registrations")
            ]);
            const camps = campsRes.data.campaigns || [];
            setCampaigns(camps);
            setRegistrations(regsRes.data.registrations || []);
            if (camps.length > 0) {
                setActiveLocationName(camps[0].location);
            }
        } catch (err) {
            console.error("Fetch campaigns failed:", err);
            setError("Failed to load campaign data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Check if volunteer is registered for this campaign
    const getRegistrationStatus = (campaignId) => {
        const reg = registrations.find(r => r.campaignId?._id === campaignId);
        return reg ? reg.status : null;
    };

    // Register Handler
    const handleRegister = async (campaignId) => {
        setError("");
        setSuccessMsg("");
        try {
            const res = await api.post(`/campaigns/${campaignId}/register`);
            if (res.data.success) {
                setSuccessMsg(res.data.message);
                fetchData();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        }
    };

    // Cancel Registration Handler
    const handleCancelRegistration = async (campaignId) => {
        setError("");
        setSuccessMsg("");
        try {
            const res = await api.delete(`/campaigns/${campaignId}/register`);
            if (res.data.success) {
                setSuccessMsg("Registration request cancelled successfully");
                fetchData();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to cancel registration");
        }
    };

    // Extract unique locations from campaigns for filter
    const uniqueLocations = ["All Locations", ...new Set(campaigns.map(c => c.location))];

    // Filter Logic
    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             c.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "All Categories" || c.category === categoryFilter;
        const matchesLocation = locationFilter === "All Locations" || c.location === locationFilter;
        return matchesSearch && matchesCategory && matchesLocation;
    });

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen py-10 px-6 md:px-12 text-left">
            <div className="max-w-[1280px] mx-auto space-y-8">
                
                {/* Hero Section */}
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-extrabold text-[#0b1c30] mb-2">Campaign Browser</h2>
                        <p className="text-lg text-[#434655] max-w-2xl font-semibold">
                            Find your next opportunity to make an impact. Filter by your interests or location to get started.
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowMap(!showMap)}
                        className="bg-[#004ac6] hover:bg-[#2563eb] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all active:scale-95 cursor-pointer self-start md:self-end"
                    >
                        <span className="material-symbols-outlined">map</span>
                        {showMap ? "Hide Map View" : "Show Map View"}
                    </button>
                </section>

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

                {/* Filter Bento Bar */}
                <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row items-center gap-4 border border-slate-200">
                    <div className="w-full lg:flex-1 relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737686]">search</span>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search campaigns like 'Blood Donation'..."
                            className="w-full pl-12 pr-4 py-3 bg-[#eff4ff] border border-[#c3c6d7] rounded-xl focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6] transition-all outline-none text-sm"
                        />
                    </div>
                    <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 sm:flex-initial">
                            <select 
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="pl-10 pr-10 py-3 bg-white border border-[#c3c6d7] rounded-xl text-sm focus:ring-2 focus:ring-[#004ac6] outline-none cursor-pointer w-full appearance-none"
                            >
                                <option value="All Categories">All Categories</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Environmental">Environmental</option>
                                <option value="Education">Education</option>
                                <option value="Food Security">Food Security</option>
                                <option value="Social Services">Social Services</option>
                            </select>
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none text-[20px]">category</span>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none text-[20px]">expand_more</span>
                        </div>
                        <div className="relative flex-1 sm:flex-initial">
                            <select 
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="pl-10 pr-10 py-3 bg-white border border-[#c3c6d7] rounded-xl text-sm focus:ring-2 focus:ring-[#004ac6] outline-none cursor-pointer w-full appearance-none"
                            >
                                {uniqueLocations.map((loc, idx) => (
                                    <option key={idx} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none text-[20px]">location_on</span>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none text-[20px]">expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard layout with Map details */}
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004ac6] mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Campaigns Cards Grid */}
                        <div className={`${showMap ? "lg:col-span-8" : "lg:col-span-12"} grid grid-cols-1 md:grid-cols-2 gap-6`}>
                            {filteredCampaigns.length === 0 ? (
                                <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-[#737686]">
                                    <span className="material-symbols-outlined text-5xl mb-2 text-[#c3c6d7]">campaign</span>
                                    <p className="font-semibold">No active campaigns match your selected filters.</p>
                                </div>
                            ) : (
                                filteredCampaigns.map((camp) => {
                                    const status = getRegistrationStatus(camp._id);
                                    
                                    // Calculate actual spots filled percentage using database count of accepted volunteers
                                    const slotsFilledCount = camp.acceptedCount || 0;
                                    const fillPercent = Math.min(Math.round((slotsFilledCount / camp.maxVolunteers) * 100), 100);

                                    return (
                                        <div 
                                            key={camp._id}
                                            onClick={() => {
                                                setActiveLocationName(camp.location);
                                                setShowMap(true);
                                            }}
                                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group border border-slate-200 cursor-pointer"
                                        >
                                            {/* Graphic header */}
                                            <div className="h-44 w-full relative bg-slate-100 overflow-hidden">
                                                 <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                                                     <span className="bg-[#eff4ff] text-[#004ac6] px-3 py-1 rounded-full font-semibold text-xs border border-blue-100 w-fit">
                                                         {camp.category}
                                                     </span>
                                                     <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide w-fit border ${
                                                         camp.status === "Completed"
                                                             ? "bg-slate-900/85 text-white border-slate-700"
                                                             : camp.status === "Active"
                                                             ? "bg-emerald-600 text-white border-emerald-500 animate-pulse"
                                                             : "bg-blue-600 text-white border-blue-500"
                                                     }`}>
                                                         {camp.status || "Upcoming"}
                                                     </span>
                                                 </div>
                                                <div className="w-full h-full bg-slate-200 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                                    style={{ backgroundImage: `url('${camp.image || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80'}')` }}
                                                ></div>
                                            </div>

                                            <div className="p-6 flex flex-col flex-1 space-y-4 text-left">
                                                <h3 className="font-bold text-xl text-[#0b1c30] line-clamp-1">{camp.title}</h3>
                                                <p className="text-xs text-[#434655] font-semibold flex items-center gap-1 w-full">
                                                     <span className="material-symbols-outlined text-sm text-[#004ac6]">location_on</span>
                                                     <span className="truncate max-w-[65%]">{camp.location}</span>
                                                     <a 
                                                         href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(camp.location)}`}
                                                         target="_blank"
                                                         rel="noopener noreferrer"
                                                         onClick={(e) => e.stopPropagation()}
                                                         className="ml-auto bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#004ac6] px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 hover:border-[#004ac6] transition-colors cursor-pointer"
                                                         title="Open in Google Maps for directions"
                                                     >
                                                         <span className="material-symbols-outlined text-[12px]">directions</span>
                                                         <span>Directions</span>
                                                     </a>
                                                 </p>
                                                <p className="text-sm text-[#434655] line-clamp-2 leading-relaxed flex-1">{camp.description}</p>
                                                
                                                {/* Spots progress fill */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold">
                                                        <span className="text-[#434655]">Volunteer Slots Filled</span>
                                                        <span className="text-[#004ac6] font-bold">{fillPercent}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-[#eff4ff] rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#006c49] rounded-full" style={{ width: `${fillPercent}%` }}></div>
                                                    </div>
                                                </div>

                                                {/* Details / Join Trigger */}
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                                                    <span className="text-xs text-slate-500 font-semibold">
                                                        {new Date(camp.date).toLocaleDateString()}
                                                    </span>
                                                    
                                                    {camp.status === "Completed" ? (
                                                        <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold border border-slate-200">
                                                            Completed
                                                        </span>
                                                    ) : camp.status === "Cancelled" ? (
                                                        <span className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold border border-red-100">
                                                            Cancelled
                                                        </span>
                                                    ) : status === null ? (
                                                        <button 
                                                            onClick={() => handleRegister(camp._id)}
                                                            className="px-5 py-2 bg-[#004ac6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                                        >
                                                            Register
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                status === "Accepted" 
                                                                    ? "bg-green-50 text-green-700 border border-green-200" 
                                                                    : status === "Rejected"
                                                                    ? "bg-red-50 text-red-700 border-red-200"
                                                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                                            }`}>
                                                                {status}
                                                            </span>
                                                            <button 
                                                                onClick={() => handleCancelRegistration(camp._id)}
                                                                className="material-symbols-outlined text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                                                                title="Cancel Registration"
                                                            >
                                                                delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Interactive Leaflet Map Panel */}
                        {showMap && (
                            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sticky top-24 self-start">
                                <h3 className="font-extrabold text-md text-[#0b1c30] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#004ac6]">map</span>
                                    <span>Interactive Event Map</span>
                                </h3>
                                <div className="h-[400px] w-full">
                                    <MapComponent locationName={activeLocationName} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Campaigns;
