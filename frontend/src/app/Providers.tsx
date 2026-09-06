"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Ensure QueryClient is initialized only once on the client-side
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false, // Prevents aggressive refetches
            retry: 1, // Only retry failed requests once
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: "glass shadow-xl text-sm font-medium rounded-2xl p-4",
            style: {
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid rgba(109, 76, 67, 0.1)",
            },
            success: {
              iconTheme: {
                primary: "#0d9488", // Teal 600
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444", // Red 500
                secondary: "#ffffff",
              },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
