"use client";

import React, { Suspense } from "react";
import VerifyEmailContent from "./VerifyEmailContent";
import { FiLoader } from "react-icons/fi";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 items-center justify-center min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <FiLoader className="text-3xl animate-spin text-brand-teal-500" />
          <p className="text-sm text-brand-brown-400 font-semibold animate-pulse">
            Loading verification details...
          </p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
