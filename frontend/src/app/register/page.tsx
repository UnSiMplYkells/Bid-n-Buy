"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { axiosClient } from "../../utils/axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiLock, FiUser, FiPhone, FiArrowRight, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import ResendVerificationButton from "../../components/ResendVerificationButton";
import { SEND_REAL_EMAILS } from "../../utils/config";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);
  const [devVerificationUrl, setDevVerificationUrl] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    document.title = "Bid'n'Buy | Join Now";
    if (accessToken) {
      router.push("/");
    }
  }, [accessToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return toast.error("Please enter email and password");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    setLoading(true);
    const toastId = toast.loading("Creating your account...");

    const payload: any = { email, password };
    if (username) payload.username = username;
    if (phoneNumber) payload.phoneNumber = phoneNumber;
    if (image) payload.image = image;

    try {
      const response = await axiosClient.post("/api/v1/auth/register", payload);
      
      toast.success(response.data?.msg || "Please check your email to verify your account.", { id: toastId });
      
      if (response.data?.devVerificationUrl) {
        setDevVerificationUrl(response.data.devVerificationUrl);
      }
      
      setIsRegisteredSuccess(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.msg || "Failed to register. Please check details.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-md w-full glass rounded-3xl p-8 shadow-xl border border-brand-brown-200/20">
        <AnimatePresence mode="wait">
          {!isRegisteredSuccess ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shadow-md mb-3">
                  <img src="/bidnbuy.png" alt="Bid'n'Buy Icon" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-bold text-brand-brown-800 dark:text-brand-brown-200">Create Account</h2>
                <p className="mt-1.5 text-sm text-brand-brown-400 dark:text-brand-brown-400 font-semibold">Join thousands of active bidders on Bid 'N Buy!</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1 block">Username (Optional)</label>
                  <div className="absolute inset-y-9 left-4 flex items-center pointer-events-none text-brand-brown-400"><FiUser /></div>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="JohnDoe" className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 outline-none text-sm font-semibold" />
                </div>

                <div className="relative">
                  <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1 block">Email Address *</label>
                  <div className="absolute inset-y-9 left-4 flex items-center pointer-events-none text-brand-brown-400"><FiMail /></div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 outline-none text-sm font-semibold" />
                </div>

                <div className="relative">
                  <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1 block">Password * (Min 6 characters)</label>
                  <div className="absolute inset-y-9 left-4 flex items-center pointer-events-none text-brand-brown-400"><FiLock /></div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 outline-none text-sm font-semibold" />
                </div>

                <div className="relative">
                  <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1 block">Phone Number (Optional)</label>
                  <div className="absolute inset-y-9 left-4 flex items-center pointer-events-none text-brand-brown-400"><FiPhone /></div>
                  <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+123456789" className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 outline-none text-sm font-semibold" />
                </div>

                <button type="submit" disabled={loading} className="w-full mt-4 flex items-center justify-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-50 group">
                  {loading ? "Creating Account..." : "Create Account"}
                  <FiArrowRight className="text-lg transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-brand-brown-400 dark:text-brand-brown-400 font-semibold">
                Already have an account? <Link href="/login" className="text-brand-teal-600 dark:text-brand-teal-400 hover:underline">Sign in</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }} className="text-center space-y-6">
              {!SEND_REAL_EMAILS && devVerificationUrl ? (
                /* Dev-only panel */
                <div className="border border-dashed border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/10 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <FiAlertTriangle className="text-2xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400">Developer Mode Enabled</h3>
                    <p className="text-xs text-brand-brown-400 dark:text-brand-brown-400 font-semibold leading-relaxed">
                      No real email was sent because simulated delivery is active. Click below to verify instantly:
                    </p>
                  </div>
                  <a
                    href={devVerificationUrl}
                    className="inline-block bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-5 rounded-2xl transition-all shadow-md active:scale-95"
                  >
                    Click here to verify {email}
                  </a>
                </div>
              ) : (
                /* Production panel */
                <>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 shadow-md">
                      <FiCheckCircle className="text-3xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-brand-brown-800 dark:text-brand-brown-200">Registration Successful!</h2>
                    <p className="text-sm text-brand-brown-400 dark:text-brand-brown-400 font-semibold leading-relaxed">
                      We've sent an activation link to <strong className="text-brand-brown-700 dark:text-brand-brown-200">{email}</strong>. Please click the link inside to verify your account and start bidding.
                    </p>
                  </div>

                  <div className="bg-brand-brown-100/30 dark:bg-brand-brown-900/10 rounded-2xl p-4 border border-brand-brown-200/5 text-left space-y-3">
                    <p className="text-xs text-brand-brown-500 dark:text-brand-brown-400 font-bold leading-normal">
                      Didn't receive the email? Check spam folder or request a new link:
                    </p>
                    <ResendVerificationButton email={email} className="w-full justify-center py-2.5 text-xs rounded-xl" />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-brand-brown-200/10">
                <Link href="/login" className="w-full flex items-center justify-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all">
                  Go to Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
