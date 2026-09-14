"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { axiosClient } from "../../utils/axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiLoader, FiMail, FiArrowRight } from "react-icons/fi";
import ResendVerificationButton from "../../components/ResendVerificationButton";
import Link from "next/link";

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    document.title = "Bid'n'Buy | Verify Email";
    if (!token) {
      setStatus("error");
      setErrorMsg("Verification token is missing. Please check your email link.");
      return;
    }
    axiosClient.get(`/api/v1/auth/verify-email/${token}`)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.response?.data?.msg || "Invalid or expired verification token.");
      });
  }, [token]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8">
      <AnimatePresence mode="wait">
        {status === "verifying" && (
          <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md w-full glass rounded-3xl p-8 shadow-xl border border-brand-brown-200/20 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-3xl bg-brand-teal-50 dark:bg-brand-teal-950/20 flex items-center justify-center text-brand-teal-500 animate-pulse">
                <FiLoader className="text-3xl animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-brand-brown-800 dark:text-brand-brown-200">Verifying Your Email</h2>
              <p className="text-sm text-brand-brown-400 dark:text-brand-brown-400 font-semibold">Please wait a moment while we secure your account...</p>
            </div>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass rounded-3xl p-8 shadow-xl border border-brand-brown-200/20 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 shadow-md">
                <FiCheckCircle className="text-3xl" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-brand-brown-800 dark:text-brand-brown-200">Email Verified!</h2>
              <p className="text-sm text-brand-brown-400 dark:text-brand-brown-400 font-semibold">Your email has been successfully verified. You can now access the bidding platform.</p>
            </div>
            <Link href="/login" className="w-full flex items-center justify-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all group">
              Go to Sign In
              <FiArrowRight className="text-lg transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass rounded-3xl p-8 shadow-xl border border-brand-brown-200/20 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 shadow-md">
                <FiAlertCircle className="text-3xl" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-brand-brown-800 dark:text-brand-brown-200">Verification Failed</h2>
              <p className="text-sm text-rose-500 dark:text-rose-400 font-semibold">{errorMsg}</p>
            </div>
            <div className="bg-brand-brown-100/30 dark:bg-brand-brown-900/10 rounded-2xl p-4 border border-brand-brown-200/5 text-left space-y-3">
              <p className="text-xs text-brand-brown-500 dark:text-brand-brown-400 font-bold leading-normal">Need a new verification link? Enter email below:</p>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-brand-brown-400"><FiMail /></div>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-brand-brown-100/50 dark:bg-brand-brown-950/30 pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-brand-teal-500 outline-none text-xs font-semibold"
                />
              </div>
              <ResendVerificationButton email={emailInput} className="w-full justify-center py-2.5 text-xs rounded-xl" />
            </div>
            <div className="border-t border-brand-brown-200/10 pt-4">
              <Link href="/login" className="text-sm font-semibold text-brand-teal-600 dark:text-brand-teal-400 hover:underline">Back to Sign In</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
