"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { axiosClient } from "../../utils/axios";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiUser, FiPhone, FiImage, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, accessToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [image, setImage] = useState("");
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

      const { user, accessToken: token } = response.data;
      
      // Save authenticated state globally
      setAuth(user, token);
      
      toast.success("Account created successfully! Welcome!", { id: toastId });
      router.push("/");
    } catch (error: any) {
      const errorMsg = error.response?.data?.msg || "Failed to register. Please check details.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
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
            Create Account
          </h2>
          <p className="mt-1.5 text-sm text-brand-brown-400 dark:text-brand-brown-400 font-semibold">
            Join thousands of active bidders on Bid 'N Buy!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="relative">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1 block">
              Username (Optional)
            </label>
            <div className="absolute inset-y-9 left-4 flex items-center pointer-events-none text-brand-brown-400 dark:text-brand-brown-400">
              <FiUser />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="JohnDoe"
              className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 dark:hover:bg-brand-brown-900/50 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1 block">
              Email Address *
            </label>
            <div className="absolute inset-y-9 left-4 flex items-center pointer-events-none text-brand-brown-400 dark:text-brand-brown-400">
              <FiMail />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 dark:hover:bg-brand-brown-900/50 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1 block">
              Password * (Min 6 characters)
            </label>
            <div className="absolute inset-y-9 left-4 flex items-center pointer-events-none text-brand-brown-400 dark:text-brand-brown-400">
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

          {/* Phone Number (Optional) */}
          <div className="relative">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1 block">
              Phone Number (Optional)
            </label>
            <div className="absolute inset-y-9 left-4 flex items-center pointer-events-none text-brand-brown-400 dark:text-brand-brown-400">
              <FiPhone />
            </div>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+123456789"
              className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 dark:hover:bg-brand-brown-900/50 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
            />
          </div>

          {/* Avatar URL (Optional) */}
          <div className="relative">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1 block">
              Avatar Image URL (Optional)
            </label>
            <div className="absolute inset-y-9 left-4 flex items-center pointer-events-none text-brand-brown-400 dark:text-brand-brown-400">
              <FiImage />
            </div>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/pic.jpg"
              className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/30 dark:hover:bg-brand-brown-900/50 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? "Creating Account..." : "Create Account"}
            <FiArrowRight className="text-lg transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        {/* Footer Links */}
        <p className="mt-6 text-center text-sm text-brand-brown-400 dark:text-brand-brown-400 font-semibold">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-teal-600 dark:text-brand-teal-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
