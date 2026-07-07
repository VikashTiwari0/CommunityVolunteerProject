import React, { useEffect, useState } from "react";
import { api } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";

const AIRecommendations = () => {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [chatHistory, setChatHistory] = useState([
        {
            sender: "ai",
            text: "Hello! I am your Unity AI Matching Assistant. I will compare your skills, interests, and location against upcoming campaigns to find the best fits."
        }
    ]);
    const [inputQuery, setInputQuery] = useState("");
    const [isAiGenerated, setIsAiGenerated] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const fetchRecommendations = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/ai/recommendations");
            setRecommendations(res.data.recommendations || []);
            setIsAiGenerated(res.data.isAiGenerated || false);
            
            // Append AI results to chat log
            const topMatch = res.data.recommendations[0];
            let aiText = "I've completed my analysis of active campaigns.";
            if (topMatch) {
                aiText += ` Based on your skills (${user?.skills?.join(", ")}) and interests, the top matching campaign is "${topMatch.campaign?.title}" with a compatibility score of ${topMatch.score}%.`;
            } else {
                aiText += " There are no upcoming matching campaigns at this time.";
            }

            setChatHistory(prev => [
                ...prev,
                { sender: "ai", text: aiText }
            ]);
        } catch (err) {
            console.error("AI matching failed:", err);
            setError("Could not retrieve AI recommendations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    // Handle Quick Join from recommendations
    const handleJoin = async (campaignId) => {
        setError("");
        setSuccessMsg("");
        try {
            const res = await api.post(`/campaigns/${campaignId}/register`);
            if (res.data.success) {
                setSuccessMsg(res.data.message);
                fetchRecommendations();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to join campaign");
        }
    };

    // Chat submit query (hitting real LangChain & Groq endpoint)
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!inputQuery.trim()) return;

        const query = inputQuery;
        setChatHistory(prev => [...prev, { sender: "user", text: query }]);
        setInputQuery("");

        try {
            const res = await api.post("/ai/chat", { message: query });
            if (res.data.success) {
                setChatHistory(prev => [
                    ...prev,
                    { sender: "ai", text: res.data.response }
                ]);
            }
        } catch (err) {
            console.error("AI chat failed:", err);
            setChatHistory(prev => [
                ...prev,
                { sender: "ai", text: "Oops, I encountered an error trying to process your message. Please try again." }
            ]);
        }
    };

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col md:pl-64 text-left">
            
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#004ac6] text-2xl">smart_toy</span>
                    <h2 className="font-bold text-lg text-[#004ac6]">AI Matching Assistant</h2>
                </div>
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Unity AI is Active
                </span>
            </header>

            {/* Split layout */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-4rem)]">
                
                {/* Left side: AI Agent Chat Log */}
                <section className="flex-1 flex flex-col border-r border-slate-200 bg-white">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar max-h-[500px] lg:max-h-[calc(100vh-14rem)]">
                        {chatHistory.map((chat, idx) => (
                            <div 
                                key={idx} 
                                className={`flex gap-3 ${chat.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {chat.sender === "ai" && (
                                    <div className="w-8 h-8 bg-[#e5eeff] rounded-full flex items-center justify-center flex-shrink-0 text-[#004ac6]">
                                        <span className="material-symbols-outlined text-sm">smart_toy</span>
                                    </div>
                                )}
                                <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                    chat.sender === "user"
                                        ? "bg-[#004ac6] text-white rounded-tr-none"
                                        : "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100"
                                }`}>
                                    <p>{chat.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <form className="p-6 border-t border-slate-200 bg-white" onSubmit={handleChatSubmit}>
                        <div className="relative flex items-center">
                            <input 
                                type="text"
                                value={inputQuery}
                                onChange={(e) => setInputQuery(e.target.value)}
                                placeholder="Filter campaigns (e.g. 'Find healthcare drives')..."
                                className="w-full bg-[#eff4ff] border border-[#c3c6d7] rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-[#004ac6] text-sm"
                            />
                            <button 
                                type="submit"
                                className="absolute right-3 bg-[#004ac6] text-white p-2.5 rounded-xl flex items-center justify-center hover:bg-[#2563eb] active:scale-95 transition-transform cursor-pointer"
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
                            <button 
                                type="button"
                                onClick={() => setInputQuery("Find environmental cleanup campaigns")}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full border border-[#c3c6d7] text-[#434655] hover:bg-slate-50 cursor-pointer"
                            >
                                Environmental
                            </button>
                            <button 
                                type="button"
                                onClick={() => setInputQuery("Show drives with medical skills")}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full border border-[#c3c6d7] text-[#434655] hover:bg-slate-50 cursor-pointer"
                            >
                                Medical Skills
                            </button>
                            <button 
                                type="button"
                                onClick={() => setInputQuery("Recommend campaigns for food security")}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full border border-[#c3c6d7] text-[#434655] hover:bg-slate-50 cursor-pointer"
                            >
                                Food Banks
                            </button>
                        </div>
                    </form>
                </section>

                {/* Right side: AI Recommendations List */}
                <section className="w-full lg:w-[480px] bg-[#f8f9ff] p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 border-t lg:border-t-0 border-slate-200">
                    <div className="text-left">
                        <h3 className="font-extrabold text-lg text-[#0b1c30]">Match Recommendations</h3>
                        <p className="text-xs text-[#737686] mt-0.5">
                            {isAiGenerated 
                                ? "Personalized recommendations generated dynamically by LangChain & Groq."
                                : "Algorithmic match scores calculated from your profile tags."}
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-xs font-semibold">
                            {successMsg}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-20 text-center flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004ac6] mx-auto"></div>
                        </div>
                    ) : recommendations.length === 0 ? (
                        <p className="text-sm text-slate-500 py-12 text-center">No recommendations found</p>
                    ) : (
                        <div className="space-y-4">
                            {recommendations.map((rec, idx) => (
                                <div 
                                    key={idx}
                                    className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex justify-between items-start mb-3 gap-2">
                                        <div className="text-left overflow-hidden">
                                            <h4 className="font-bold text-slate-800 text-sm truncate leading-snug">{rec.campaign?.title}</h4>
                                            <span className="bg-[#eff4ff] text-[#004ac6] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1.5 inline-block">
                                                {rec.campaign?.category}
                                            </span>
                                        </div>
                                        <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                                            {rec.score}% Match
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#434655] font-semibold leading-relaxed text-left mb-4">{rec.reason}</p>
                                    
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            {rec.campaign?.location}
                                        </span>
                                        <button 
                                            onClick={() => handleJoin(rec.campaignId)}
                                            className="px-4 py-1.5 bg-[#004ac6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-lg transition-colors active:scale-95 cursor-pointer"
                                        >
                                            Register Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
};

export default AIRecommendations;
