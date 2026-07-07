import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Volunteer");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [skillsText, setSkillsText] = useState("");
    const [interestsText, setInterestsText] = useState("");
    const [availability, setAvailability] = useState("Weekends");
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const skills = skillsText.split(",").map(s => s.trim()).filter(Boolean);
        const interests = interestsText.split(",").map(i => i.trim()).filter(Boolean);

        const res = await register({
            name,
            email,
            password,
            role,
            phone,
            location,
            skills,
            interests,
            availability
        });

        setLoading(false);
        if (res.success) {
            navigate("/dashboard");
        } else {
            setError(res.message);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        const res = await loginWithGoogle();
        setLoading(false);

        if (res.success) {
            navigate("/dashboard");
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex items-center justify-center overflow-x-hidden p-4">
            <div className="flex w-full max-w-[1200px] bg-white rounded-xl shadow-sm overflow-hidden m-4 md:m-8">
                {/* Left Panel: Visual (Hidden on small screens) */}
                <div className="hidden md:block md:w-5/12 relative bg-slate-900">
                    <div className="absolute inset-0 bg-[#004ac6] opacity-20 mix-blend-multiply z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#004ac6]/60 to-transparent z-10"></div>
                    <img
                        className="w-full h-full object-cover opacity-90"
                        src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80"
                        alt="Volunteers planting seeds"
                    />
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-4/5 bg-white/80 backdrop-blur-md rounded-xl p-6 z-20 shadow-lg border border-white/20 text-left">
                        <h4 className="text-xl font-bold text-[#0b1c30] mb-2">Build Communities</h4>
                        <p className="text-sm text-[#434655]">"Joining as a volunteer allowed me to directly contribute to local food drives. It is extremely rewarding."</p>
                    </div>
                </div>

                {/* Right Panel: Form */}
                <div className="w-full md:w-7/12 flex flex-col p-8 md:p-12 overflow-y-auto">
                    {/* Logo */}
                    <div className="mb-6 flex items-center gap-2 text-left">
                        <div className="w-10 h-10 bg-[#004ac6] rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined">volunteer_activism</span>
                        </div>
                        <span className="font-bold text-2xl text-[#004ac6]">UnityVolunteer</span>
                    </div>

                    <div className="mb-6 text-left">
                        <h1 className="text-2xl font-bold text-[#0b1c30] mb-1">Create Account</h1>
                        <p className="text-[#434655] text-xs">Join our platform, support social events, and earn certificates.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded font-semibold text-left">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4 text-left" onSubmit={handleSubmit}>
                        {/* OAuth */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[#c3c6d7] rounded-lg font-semibold text-sm text-[#0b1c30] hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative flex items-center justify-center py-1">
                            <div className="flex-grow border-t border-[#c3c6d7]"></div>
                            <span className="flex-shrink mx-4 text-[#434655] text-xs font-semibold">or fill registration details</span>
                            <div className="flex-grow border-t border-[#c3c6d7]"></div>
                        </div>

                        {/* Basic Info Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#0b1c30] mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Alex Johnson"
                                    className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm focus:border-[#004ac6] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#0b1c30] mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="alex@example.com"
                                    className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm focus:border-[#004ac6] outline-none"
                                />
                            </div>
                        </div>

                        {/* Password & Role */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#0b1c30] mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm focus:border-[#004ac6] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#0b1c30] mb-1">I want to join as</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm focus:border-[#004ac6] outline-none cursor-pointer"
                                >
                                    <option value="Volunteer">Volunteer</option>
                                    <option value="Admin">NGO / College Admin</option>
                                </select>
                            </div>
                        </div>

                        {/* Phone & Location */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#0b1c30] mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 555-0199"
                                    className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm focus:border-[#004ac6] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#0b1c30] mb-1">Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Seattle, WA"
                                    className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm focus:border-[#004ac6] outline-none"
                                />
                            </div>
                        </div>

                        {/* Extra Volunteer Info (Visible if role is Volunteer) */}
                        {role === "Volunteer" && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#0b1c30] mb-1">Skills (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={skillsText}
                                            onChange={(e) => setSkillsText(e.target.value)}
                                            placeholder="First Aid, Coding, Packing, Teaching"
                                            className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm focus:border-[#004ac6] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#0b1c30] mb-1">Interests (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={interestsText}
                                            onChange={(e) => setInterestsText(e.target.value)}
                                            placeholder="Healthcare, Environment, Education"
                                            className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm focus:border-[#004ac6] outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#0b1c30] mb-1">Availability</label>
                                    <select
                                        value={availability}
                                        onChange={(e) => setAvailability(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg text-sm focus:border-[#004ac6] outline-none cursor-pointer"
                                    >
                                        <option value="Weekends">Weekends</option>
                                        <option value="Weekdays">Weekdays</option>
                                        <option value="Flexible">Flexible / Anytime</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Register Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#004ac6] hover:bg-[#2563eb] text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm active:scale-[0.98] cursor-pointer mt-4"
                        >
                            {loading ? "Creating Account..." : "Register"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-[#434655]">
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#004ac6] font-bold hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
