import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// SVG: Circle of diverse, hand-drawn figures holding hands (inspired by the user's poster)
const PeopleCircleSVG = () => (
  <svg
    width="260"
    height="140"
    viewBox="0 0 260 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto mb-6"
    style={{ position: "relative", top: "-10px" }}
  >
    {/* Sun/Glow in background */}
    <circle cx="130" cy="70" r="60" fill="url(#sunGradient)" opacity="0.18" />
    <defs>
      <radialGradient
        id="sunGradient"
        cx="0.5"
        cy="0.5"
        r="0.5"
        fx="0.5"
        fy="0.5"
      >
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#FFB347" />
      </radialGradient>
    </defs>
    {/* Circle of people (diverse, hand-drawn, some outside the card) */}
    <g stroke="#222" strokeWidth="2" strokeLinecap="round">
      {/* 12 figures around a circle */}
      {/* Top left, outside card */}
      <circle cx="40" cy="40" r="10" fill="#F9C846" />
      <rect x="35" y="50" width="10" height="25" rx="5" fill="#F9C846" />
      {/* Top, inside card */}
      <circle cx="80" cy="25" r="8" fill="#6C63FF" />
      <rect x="76" y="33" width="8" height="18" rx="4" fill="#6C63FF" />
      {/* Top right, inside card */}
      <ellipse cx="120" cy="20" rx="9" ry="7" fill="#43D9AD" />
      <rect x="115" y="27" width="9" height="20" rx="4.5" fill="#43D9AD" />
      {/* Right, outside card */}
      <circle cx="180" cy="40" r="10" fill="#FF6584" />
      <rect x="175" y="50" width="10" height="25" rx="5" fill="#FF6584" />
      {/* Bottom right, inside card */}
      <ellipse cx="200" cy="90" rx="7" ry="9" fill="#F9A826" />
      <rect x="196" y="99" width="7" height="12" rx="3.5" fill="#F9A826" />
      {/* Bottom, inside card */}
      <circle cx="130" cy="120" r="10" fill="#2EC4B6" />
      <rect x="125" y="130" width="10" height="18" rx="5" fill="#2EC4B6" />
      {/* Bottom left, inside card */}
      <ellipse cx="60" cy="100" rx="8" ry="10" fill="#B388FF" />
      <rect x="56" y="109" width="8" height="18" rx="4" fill="#B388FF" />
      {/* Left, outside card */}
      <circle cx="20" cy="80" r="9" fill="#FFB347" />
      <rect x="15" y="89" width="9" height="20" rx="4.5" fill="#FFB347" />
      {/* Arms (lines connecting people in a circle) */}
      <polyline
        points="50,50 80,25 120,20 180,40 200,90 130,120 60,100 20,80 40,40 50,50"
        fill="none"
        stroke="#222"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Simple email/phone validation
  const isEmail = (val: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
  const isPhone = (val: string) =>
    /^\+?\d{10,15}$/.test(val.replace(/\s/g, ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError("Email/Phone and password are required.");
      return;
    }
    if (!isEmail(identifier) && !isPhone(identifier)) {
      setError("Please enter a valid email or phone number.");
      return;
    }
    setLoading(true);
    try {
      let result;
      if (isEmail(identifier)) {
        result = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          phone: identifier,
          password,
        });
      }
      if (result.error) {
        setError(result.error.message);
      } else if (result.data.session) {
        // Success: redirect to dashboard or home
        navigate("/dashboard");
      } else {
        setError("Unknown error. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
      }}
    >
      <div
        className="bg-gray-50 rounded-3xl shadow-lg p-10 md:p-14 w-full max-w-lg flex flex-col items-center relative"
        style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)" }}
      >
        {/* Circle of Diverse People Illustration with Sun/Glow */}
        <PeopleCircleSVG />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
          Sign in to join the circle
        </h1>
        <p className="text-gray-500 text-base mb-8 text-center max-w-xs">
          Collaboration starts here. Every voice matters. The journey may be up
          and down, but you're always part of the circle.
        </p>
        <form
          className="w-full flex flex-col space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Email or Phone Number"
              className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg outline-none transition"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg outline-none transition"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg shadow hover:shadow-lg transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="flex flex-col items-center mt-8 w-full">
          <a href="#" className="text-blue-600 hover:underline text-sm mb-1">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
