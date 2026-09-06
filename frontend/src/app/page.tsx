"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore";
import { axiosClient } from "../utils/axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiCalendar, FiClock, FiDollarSign, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useSocket } from "../hooks/useSocket";
import { formatDistanceToNow } from "date-fns";

interface Auction {
  _id: string;
  name: string;
  desc: string;
  askingPrice: number;
  currentPrice: number;
  endTime: string;
  image?: string;
  status: "active" | "closed";
  highestBidder?: string;
}

interface AuctionsResponse {
  auctions: Auction[];
  count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"active" | "closed">("active");
  const [page, setPage] = useState(1);

  // Initialize global sockets hook to capture outbid notifications globally
  useSocket();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

  // Debounce search inputs to avoid redundant API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 450);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch auctions using TanStack Query
  const { data, isLoading, isError } = useQuery<AuctionsResponse>({
    queryKey: ["auctions", { status, name: debouncedSearch, page }],
    queryFn: async () => {
      const response = await axiosClient.get("/api/v1/auction/all", {
        params: { status, name: debouncedSearch, page, limit: 9 },
      });
      return response.data;
    },
    enabled: !!accessToken,
    placeholderData: keepPreviousData, // Updated for React Query v5
  });

  if (!accessToken) {
    return null; // Don't flash screen while redirecting
  }

  const auctions = data?.auctions || [];
  const totalPages = data?.count ? Math.ceil(data.count / 9) : 1;

  return (
    <div className="flex-1 w-full space-y-8">
      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-brand-brown-100/40 dark:bg-brand-brown-900/10 p-4 rounded-2xl border border-brand-brown-200/10">
        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-brown-400">
            <FiSearch className="text-lg" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name..."
            className="w-full bg-brand-brown-100/50 hover:bg-brand-brown-100 dark:bg-brand-brown-900/20 dark:hover:bg-brand-brown-900/40 pl-11 pr-4 py-3 rounded-xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 w-full md:w-auto">
          {(["active", "closed"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setStatus(type);
                setPage(1);
              }}
              className={`flex-1 md:w-36 py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                status === type
                  ? "bg-brand-teal-600 text-white shadow-md scale-102"
                  : "bg-brand-brown-100/60 text-brand-brown-500 hover:text-brand-teal-600 dark:bg-brand-brown-900/30 dark:text-brand-brown-300 dark:hover:text-brand-teal-400"
              }`}
            >
              {type === "active" ? "🔥 Active Bids" : "⌛ Closed Listings"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton View */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="glass rounded-3xl p-5 space-y-4 animate-pulse border border-brand-brown-200/10"
            >
              <div className="w-full h-48 bg-brand-brown-200 dark:bg-brand-brown-800 rounded-2xl" />
              <div className="h-6 w-3/4 bg-brand-brown-200 dark:bg-brand-brown-800 rounded-md" />
              <div className="h-4 w-1/2 bg-brand-brown-200 dark:bg-brand-brown-800 rounded-md" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-8 w-1/3 bg-brand-brown-200 dark:bg-brand-brown-800 rounded-md" />
                <div className="h-10 w-1/4 bg-brand-brown-200 dark:bg-brand-brown-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 glass rounded-3xl p-8 max-w-lg mx-auto border border-red-500/10">
          <p className="text-red-500 font-semibold mb-2">Error Loading Auctions</p>
          <p className="text-sm text-brand-brown-400 dark:text-brand-brown-400">
            We ran into an issue syncing auctions. Please check your network or try refreshing.
          </p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl max-w-lg mx-auto border border-brand-brown-200/10">
          <p className="text-brand-brown-600 dark:text-brand-brown-200 font-bold text-lg mb-2">
            No Auctions Found
          </p>
          <p className="text-sm text-brand-brown-400 dark:text-brand-brown-400">
            There are currently no {status} listings matching your filters.
          </p>
        </div>
      ) : (
        /* Grid Auctions Feed */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {auctions.map((auction) => {
              const isClosed = auction.status === "closed";
              const timeString = isClosed
                ? "Ended"
                : formatDistanceToNow(new Date(auction.endTime), { addSuffix: true });

              return (
                <motion.div
                  key={auction._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => router.push(`/auction/${auction._id}`)}
                  className="glass rounded-3xl p-5 border border-brand-brown-200/10 hover:border-brand-teal-500/30 dark:hover:border-brand-teal-400/20 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group"
                >
                  {/* Card Image */}
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 bg-brand-brown-100 dark:bg-brand-brown-900/50">
                    <img
                      src={auction.image || "https://th.bing.com/th/id/OIP.3SwljyV2T5JnvEqkwrZMfQHaHa?w=156&h=180&c=7&r=0&o=7&pid=1.7&rm=3"}
                      alt={auction.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                    />
                    {isClosed ? (
                      <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase">
                        Closed
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 bg-brand-teal-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                        <FiClock /> Active
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-brand-brown-800 dark:text-brand-brown-200 line-clamp-1 group-hover:text-brand-teal-600 dark:group-hover:text-brand-teal-400 transition-colors">
                        {auction.name}
                      </h3>
                      <p className="text-xs text-brand-brown-400 dark:text-brand-brown-400 line-clamp-2 mt-1 font-semibold leading-relaxed">
                        {auction.desc}
                      </p>
                    </div>

                    {/* Timeline and Prices footer */}
                    <div className="pt-2 border-t border-brand-brown-200/10">
                      <div className="flex justify-between items-center text-xs text-brand-brown-400 dark:text-brand-brown-400 font-bold mb-2">
                        <span className="flex items-center gap-1 text-[11px]">
                          <FiCalendar /> {timeString}
                        </span>
                        <span className="text-[11px]">
                          Start: ${auction.askingPrice}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-brown-400 dark:text-brand-brown-400">
                            Current Price
                          </span>
                          <span className="text-lg font-extrabold text-brand-teal-700 dark:text-brand-teal-400 flex items-center">
                            <FiDollarSign className="text-sm mr-0.5" />
                            {auction.currentPrice}
                          </span>
                        </div>
                        <span className="bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-600 dark:text-brand-teal-400 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-colors group-hover:bg-brand-teal-600 group-hover:text-white">
                          {isClosed ? "View Listing" : "Place Bid"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination Controls */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="w-10 h-10 rounded-xl bg-brand-brown-100/60 hover:bg-brand-brown-200 dark:bg-brand-brown-900/30 dark:hover:bg-brand-brown-800/40 flex items-center justify-center text-brand-brown-600 dark:text-brand-brown-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <FiArrowLeft />
          </button>
          <span className="text-sm font-bold text-brand-brown-500 dark:text-brand-brown-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="w-10 h-10 rounded-xl bg-brand-brown-100/60 hover:bg-brand-brown-200 dark:bg-brand-brown-900/30 dark:hover:bg-brand-brown-800/40 flex items-center justify-center text-brand-brown-600 dark:text-brand-brown-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <FiArrowRight />
          </button>
        </div>
      )}
    </div>
  );
}