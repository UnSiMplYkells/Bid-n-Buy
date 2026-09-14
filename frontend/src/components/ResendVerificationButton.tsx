"use client";

import React, { useState, useEffect, useRef } from "react";
import { axiosClient } from "../utils/axios";
import toast from "react-hot-toast";

interface ResendVerificationButtonProps {
  email: string;
  className?: string;
}

export default function ResendVerificationButton({
  email,
  className = "",
}: ResendVerificationButtonProps) {
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const checkCooldown = () => {
    if (!email) return;
    const lastSentStr = localStorage.getItem(`last-resend-email-${email}`);
    if (lastSentStr) {
      const lastSent = parseInt(lastSentStr, 10);
      const now = Date.now();
      const elapsed = now - lastSent;
      const threeMinutes = 3 * 60 * 1000; // 180,000ms

      if (elapsed < threeMinutes) {
        const remainingSeconds = Math.ceil((threeMinutes - elapsed) / 1000);
        setCooldown(remainingSeconds);
        return remainingSeconds;
      }
    }
    setCooldown(0);
    return 0;
  };

  useEffect(() => {
    const remaining = checkCooldown();

    if (remaining && remaining > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [email]);

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!email) {
      return toast.error("Email is required to resend verification link.");
    }

    // Double check state
    const currentRemaining = checkCooldown();
    if (currentRemaining && currentRemaining > 0) {
      const minutes = Math.floor(currentRemaining / 60);
      const seconds = currentRemaining % 60;
      return toast.error(
        `Please wait ${minutes}m ${seconds}s before requesting another verification email.`
      );
    }

    const resendPromise = async () => {
      const response = await axiosClient.post("/api/v1/auth/resend-verification", {
        email,
      });
      return response.data;
    };

    try {
      await toast.promise(resendPromise(), {
        loading: "Resending verification email...",
        success: "Verification email resent! Please check your inbox and spam folder.",
        error: (err: any) =>
          err.response?.data?.msg || "Could not resend email. Please try again.",
      });

      // Update cooldown in localStorage and state
      localStorage.setItem(`last-resend-email-${email}`, Date.now().toString());
      setCooldown(180);

      // Start countdown
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      // toast.promise handles the error rendering
    }
  };

  const minutes = Math.floor(cooldown / 60);
  const seconds = cooldown % 60;
  const timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <button
      onClick={handleResend}
      disabled={cooldown > 0}
      className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-sm ${
        cooldown > 0
          ? "bg-brand-brown-200/50 text-brand-brown-400 dark:bg-brand-brown-900/30 cursor-not-allowed"
          : "bg-brand-teal-600 hover:bg-brand-teal-500 text-white cursor-pointer active:scale-95"
      } ${className}`}
    >
      {cooldown > 0 ? `Resend in ${timeString}` : "Resend Verification Email"}
    </button>
  );
}
