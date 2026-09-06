"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { axiosClient } from "../../utils/axios";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, accessToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (accessToken) {
      router.push("/");
    }
  }, [accessToken, router]);

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
      const errorMsg = error.response?.data?.msg || "Invalid credentials. Please try again.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full glass rounded-3xl p-8 shadow-xl border border-brand-brown-200/20"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-teal-600 flex items-center justify-center text-white font-bold text-2xl shadow-md mb-3">
            B
          </div>
          <h2 className="text-2xl font-bold text-brand-brown-800 dark:text-brand-brown-200">
            Welcome Back
          </h2>
          <p className="mt-1.5 text-sm text-brand-brown-400 dark:text-brand-brown-400">
            Sign in to start bidding on live items!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="relative">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1.5 block">
              Email Address
            </label>
            <div className="absolute inset-y-11 left-4 flex items-center pointer-events-none text-brand-brown-400 dark:text-brand-brown-400">
              <FiMail />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 dark:hover:bg-brand-brown-900/50 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
            />
          </div>

          {/* Password input */}
          <div className="relative">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1.5 block">
              Password
            </label>
            <div className="absolute inset-y-11 left-4 flex items-center pointer-events-none text-brand-brown-400 dark:text-brand-brown-400">
              <FiLock />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 dark:hover:bg-brand-brown-900/50 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? "Authenticating..." : "Sign In"}
            <FiArrowRight className="text-lg transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        {/* Footer Links */}
        <p className="mt-8 text-center text-sm text-brand-brown-400 dark:text-brand-brown-400 font-semibold">
          New to the platform?{" "}
          <Link
            href="/register"
            className="text-brand-teal-600 dark:text-brand-teal-400 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
