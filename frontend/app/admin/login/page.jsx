"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  Sparkles,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import { adminLogin, adminVerifyToken } from "../../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const usernameRef = useRef(null);


  useEffect(() => {
    const validateExistingSession = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (token) {
          const res = await adminVerifyToken(token);
          if (res?.valid) {
            router.replace("/admin");
            return;
          }
        }
      } catch {
      
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
      } finally {
        setCheckingSession(false);
      }
    };
    validateExistingSession();
  }, [router]);

 
  useEffect(() => {
    if (!checkingSession && usernameRef.current) {
      usernameRef.current.focus();
    }
  }, [checkingSession]);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    const trimmedPassword = password;

    if (!trimmedUsername) {
      setError("Username is required");
      return;
    }
    if (!trimmedPassword) {
      setError("Password is required");
      return;
    }

    try {
      setLoading(true);
      const result = await adminLogin(trimmedUsername, trimmedPassword);

      if (result?.success && result?.token) {
      
        localStorage.setItem("admin_token", result.token);
        localStorage.setItem("admin_user", JSON.stringify(result.admin));
      
        router.replace("/admin");
      } else {
        setError(result?.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

 
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0a0b12] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0b12] flex items-center justify-center overflow-hidden px-4">
     
      <div className="pointer-events-none absolute -top-60 left-1/3 h-[600px] w-[600px] rounded-full bg-violet-700/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-700/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-purple-800/8 blur-[100px]" />

     
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full bg-violet-500/20"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}

    
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Card glow border effect */}
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-violet-600/40 via-indigo-600/20 to-transparent blur-sm" />

        <div className="relative rounded-3xl border border-gray-800/80 bg-[#11121e]/95 backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Top accent line */}
          <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600" />

          <div className="p-8 sm:p-10">
           
            <div className="mb-8 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-900/50"
              >
                <ShieldCheck className="h-8 w-8 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="mb-1 flex items-center justify-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-white">
                    Admin Portal
                  </h1>
                  <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-violet-300 border border-violet-500/30">
                    Secure
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  AI Interview Platform · Administration Access
                </p>
              </motion.div>
            </div>

           
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mb-5 overflow-hidden"
                >
                  <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <p className="text-sm font-medium text-red-200">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

           
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Username */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label
                  htmlFor="admin-username"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400"
                >
                  Username or Email
                </label>
                <div className="relative group">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition group-focus-within:text-violet-400" />
                  <input
                    ref={usernameRef}
                    id="admin-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="admin"
                    className="w-full rounded-xl border border-gray-700/80 bg-gray-900/60 py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 hover:border-gray-600"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400"
                >
                  Password
                </label>
                <div className="relative group">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition group-focus-within:text-violet-400" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-gray-700/80 bg-gray-900/60 py-3.5 pl-11 pr-12 text-sm text-white placeholder-gray-500 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 hover:border-gray-600"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="pt-1"
              >
                <button
                  id="admin-login-submit"
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-800/50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#11121e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {/* Shimmer */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  <span className="relative flex items-center justify-center gap-2.5">
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                        />
                        <span>Authenticating…</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        <span>Sign in to Admin Portal</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            </form>

            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-7 rounded-2xl border border-amber-800/30 bg-amber-950/20 px-4 py-3.5"
            >
              <div className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                <div className="text-xs text-amber-200/80 leading-relaxed">
                  <span className="font-bold text-amber-300">Restricted Access.</span>{" "}
                  This portal is exclusively for platform administrators. Unauthorized access
                  attempts are logged. Your session expires automatically after 8 hours.
                </div>
              </div>
            </motion.div>

           
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-5 text-center"
            >
              <button
                onClick={() => router.push("/login")}
                className="text-xs text-gray-500 transition hover:text-gray-300 underline underline-offset-2"
              >
                Not an admin? Go to candidate login →
              </button>
            </motion.div>
          </div>
        </div>

       
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-6 text-center text-[11px] text-gray-600"
        >
          AI Interview Platform · Admin Panel · Session secured with JWT
        </motion.p>
      </motion.div>
    </div>
  );
}
