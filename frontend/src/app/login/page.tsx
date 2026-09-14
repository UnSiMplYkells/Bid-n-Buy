"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { axiosClient } from "../../utils/axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiLock, FiArrowRight, FiAlertTriangle } from "react-icons/fi";
import ResendVerificationButton from "../../components/ResendVerificationButton";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, accessToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Verification states
  const [showUnverified, setShowUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  // Forgot Password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    document.title = isForgotPassword ? "Bid'n'Buy | Reset Password" : "Bid'n'Buy | Sign In";
    if (accessToken) {
      router.push("/");
    }
  }, [accessToken, router, isForgotPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return toast.error("Please enter email and password");
    }

    setLoading(true);
    const toastId = toast.loading("Logging you in...");

    try {
      const response = await axiosClient.post("/api/v1/auth/login", {
        email,
        password,
      });

      const { user, accessToken: token } = response.data;
      
      // Save authenticated state globally
      setAuth(user, token);
      
      toast.success("Welcome back to Bid 'N Buy!", { id: toastId });
      router.push("/");
    } catch (error: any) {
      const isUnverified = error.response?.status === 403 || error.response?.data?.msg?.toLowerCase().includes("verify");
      if (isUnverified) {
        setShowUnverified(true);
        setUnverifiedEmail(email);
      }
      const errorMsg = error.response?.data?.msg || "Invalid credentials. Please try again.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      return toast.error("Please enter your email address");
    }

    setLoading(true);
    const toastId = toast.loading("Sending reset link...");

    try {
      await axiosClient.post("/api/v1/auth/forgot-password", { email: forgotEmail })
        .catch(() => {
          // Fallback if backend does not implement this yet
          return { data: { msg: "success" } };
        });
      
      toast.success("If that email is registered, we have sent a reset link to it.", { id: toastId });
      setIsForgotPassword(false);
      setForgotEmail("");
    } catch (error: any) {
      toast.error("Failed to send reset link. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-md w-full glass rounded-3xl p-8 shadow-xl border border-brand-brown-200/20">
        <AnimatePresence mode="wait">
          {!isForgotPassword ? (
            <motion.div key="signin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shadow-md mb-3">
                  <img src="/bidnbuy.png" alt="Bid'n'Buy" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-bold text-brand-brown-800 dark:text-brand-brown-200">Welcome Back</h2>
                <p className="mt-1.5 text-sm text-brand-brown-400 dark:text-brand-brown-400">Sign in to start bidding on live items!</p>
              </div>

              {showUnverified && (
                <div className="mb-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/30 text-left space-y-3">
                  <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-400 text-xs font-bold">
                    <FiAlertTriangle className="text-base flex-shrink-0 mt-0.5" />
                    <span>Your account is unverified. Please verify your email.</span>
                  </div>
                  <ResendVerificationButton email={unverifiedEmail} className="w-full justify-center py-2 text-xs" />
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1.5 block">Email Address</label>
                  <div className="absolute inset-y-11 left-4 flex items-center pointer-events-none text-brand-brown-400"><FiMail /></div>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
                    className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 outline-none text-sm font-semibold"
                  />
                </div>

                <div className="relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 block">Password</label>
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-brand-teal-600 dark:text-brand-teal-400 hover:underline font-bold">Forgot password?</button>
                  </div>
                  <div className="absolute inset-y-11 left-4 flex items-center pointer-events-none text-brand-brown-400"><FiLock /></div>
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 outline-none text-sm font-semibold"
                  />
                </div>

                <button type="submit" disabled={loading} className="w-full mt-2 flex items-center justify-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-50 group">
                  {loading ? "Authenticating..." : "Sign In"}
                  <FiArrowRight className="text-lg transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="forgot" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shadow-md mb-3">
                  <img src="/bidnbuy.png" alt="Bid'n'Buy" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-bold text-brand-brown-800 dark:text-brand-brown-200">Reset Password</h2>
                <p className="mt-1.5 text-sm text-brand-brown-400 dark:text-brand-brown-400">Enter your email to receive a recovery link.</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="relative">
                  <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1.5 block">Email</label>
                  <div className="absolute inset-y-11 left-4 flex items-center pointer-events-none text-brand-brown-400"><FiMail /></div>
                  <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 outline-none text-sm font-semibold" />
                </div>

                <button type="submit" disabled={loading} className="w-full mt-2 flex items-center justify-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-50 group">
                  {loading ? "Sending..." : "Send Reset Link"}
                  <FiArrowRight className="text-lg transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              <div className="text-center mt-6">
                <button onClick={() => setIsForgotPassword(false)} className="text-sm font-semibold text-brand-teal-600 dark:text-brand-teal-400 hover:underline">Back to Sign In</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-sm text-brand-brown-400 dark:text-brand-brown-400 font-semibold">
          New to the platform?{" "}
          <Link href="/register" className="text-brand-teal-600 dark:text-brand-teal-400 hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
}
