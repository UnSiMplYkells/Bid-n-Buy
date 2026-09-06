"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore";
import { axiosClient } from "../utils/axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiSearch, FiCalendar, FiClock, FiDollarSign, FiArrowLeft, FiArrowRight, 
  FiTrendingUp, FiShield, FiBell, FiZap, FiArrowUpRight, FiLock 
} from "react-icons/fi";
import { useSocket } from "../hooks/useSocket";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Auction {
  _id: string;
  name: string;
  desc: string;
  askingPrice: number;
  currentPrice: number;
  endTime: string;
  image?: string;
  status: "active" | "closed";
  createdBy: string;
  highestBidder?: string;
}

interface AuctionsResponse {
  auctions: Auction[];
  count: number;
}

export default function HomeHubPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const currentUserId = user && (user as any)._id;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"active" | "closed">("active");
  const [page, setPage] = useState(1);

  useSocket();

  useEffect(() => {
    document.title = "Bid'n'Buy | Live Auctions";
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);

    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["auctions", { status, name: debouncedSearch, page }],
    queryFn: async (): Promise<AuctionsResponse> => {
      const response = await axiosClient.get("/api/v1/auction/all", {
        params: { status, name: debouncedSearch, page, limit: 9 },
      });
      return response.data;
    },
    enabled: !!accessToken,
    placeholderData: keepPreviousData,
  });

  const auctions: Auction[] = data?.auctions || [];
  const totalPages = data?.count ? Math.ceil(data.count / 9) : 1;

  const featuredMockups = [
    {
      _id: "mock-1",
      name: "Vintage Rolex Submariner (1982)",
      desc: "An incredible retro timepiece in outstanding condition, completely unpolished.",
      askingPrice: 5000,
      currentPrice: 6200,
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
      image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=600&q=80",
      status: "active" as const,
      createdBy: "external",
    },
    {
      _id: "mock-2",
      name: "Retro Mahogany Wood Cabinet",
      desc: "Warm tones and exquisite mid-century design. Perfect for modern living rooms.",
      askingPrice: 350,
      currentPrice: 420,
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80",
      status: "active" as const,
      createdBy: "external",
    },
    {
      _id: "mock-3",
      name: "Original Abstract Oil Painting",
      desc: "Breathtaking hand-painted textured canvas using premium earthy teal tones.",
      askingPrice: 800,
      currentPrice: 1100,
      endTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80",
      status: "active" as const,
      createdBy: "external",
    }
  ];

  if (!accessToken) {
    return (
      <div className="flex-1 w-full space-y-20 pb-12">
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <span className="inline-block bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-600 dark:text-brand-teal-400 text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-sm tracking-wider uppercase">
              ⚡ LIVE & REAL-TIME BIDDING PLATFORM
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-brand-brown-900 dark:text-brand-brown-50 leading-tight">
              Discover, Bid, and Win <br />
              <span className="text-brand-teal-600 dark:text-brand-teal-400">Premium Unique Items</span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm md:text-base font-semibold text-brand-brown-700 dark:text-brand-brown-300 leading-relaxed">
              Experience the adrenaline of live bidding battles. Track real-time prices, list products instantly, and receive immediate outbid alerts over web sockets.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-2xl bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-extrabold text-sm shadow-lg flex items-center gap-2 group transition-all"
            >
              Get Started Free <FiArrowUpRight className="text-lg transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-2xl bg-brand-brown-100 hover:bg-brand-brown-200 dark:bg-brand-brown-900/40 dark:hover:bg-brand-brown-800/40 text-brand-brown-700 dark:text-brand-brown-200 font-extrabold text-sm transition-all"
            >
              Explore Live Feed
            </Link>
          </motion.div>
        </section>

        <section className="space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-extrabold text-brand-brown-800 dark:text-brand-brown-200">
              🔥 Active Auction Previews
            </h2>
            <p className="text-xs text-brand-brown-600 dark:text-brand-brown-400 font-semibold">
              Log in or create a free account to join these live bidding lobbies!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMockups.map((auction, idx) => (
              <motion.div
                key={auction._id}
                whileHover={{ y: -4 }}
                className="glass rounded-3xl p-5 border border-brand-brown-200/10 shadow-sm flex flex-col justify-between space-y-4 group relative"
              >
                <div>
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 bg-brand-brown-100 dark:bg-brand-brown-900/50">
                    <img
                      src={auction.image}
                      alt={auction.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                    />
                    <div className="absolute top-3 right-3 bg-brand-teal-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <FiClock /> Active
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-brand-brown-800 dark:text-brand-brown-200 line-clamp-1 group-hover:text-brand-teal-600 dark:group-hover:text-brand-teal-400 transition-colors">
                      {auction.name}
                    </h3>
                    <p className="text-xs text-brand-brown-600 dark:text-brand-brown-400 line-clamp-2 leading-relaxed font-semibold">
                      {auction.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-brown-200/10">
                  <div className="flex justify-between items-center text-xs text-brand-brown-600 dark:text-brand-brown-400 font-bold mb-2">
                    <span className="flex items-center gap-1 text-[11px]">
                      <FiCalendar /> Active
                    </span>
                    <span className="text-[11px]">
                      Start: ${auction.askingPrice}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-brown-500">
                        Current Price
                      </span>
                      <span className="text-lg font-extrabold text-brand-teal-700 dark:text-brand-teal-400 flex items-center">
                        <FiDollarSign className="text-sm mr-0.5" />
                        {auction.currentPrice}
                      </span>
                    </div>
                    <Link
                      href="/login"
                      className="bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-600 dark:text-brand-teal-400 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 hover:bg-brand-teal-600 hover:text-white transition-colors"
                    >
                      <FiLock className="text-xs" /> Bid Now
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="space-y-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-extrabold text-brand-brown-800 dark:text-brand-brown-200 text-center">
            🔒 Engineered for Safety & Real-Time Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold">
            {/* Sockets */}
            <div className="flex gap-4 p-5 glass rounded-3xl border border-brand-brown-200/10">
              <div className="w-10 h-10 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/30 text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center text-lg flex-shrink-0">
                <FiZap />
              </div>
              <div className="space-y-1">
                <h4 className="text-brand-brown-800 dark:text-brand-brown-200 font-bold">WebSocket Streaming</h4>
                <p className="text-xs text-brand-brown-600 dark:text-brand-brown-400 leading-relaxed">
                  Real-time broadcast pipelines. Get immediate price updates on active screens and dynamic slide-out alarms whenever you are outbid.
                </p>
              </div>
            </div>

            {/* Transactions */}
            <div className="flex gap-4 p-5 glass rounded-3xl border border-brand-brown-200/10">
              <div className="w-10 h-10 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/30 text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center text-lg flex-shrink-0">
                <FiShield />
              </div>
              <div className="space-y-1">
                <h4 className="text-brand-brown-800 dark:text-brand-brown-200 font-bold">ACID Transactions</h4>
                <p className="text-xs text-brand-brown-600 dark:text-brand-brown-400 leading-relaxed">
                  Every single bid is backed by safe MongoDB transaction sessions and optimistic concurrency checks to eliminate race conditions.
                </p>
              </div>
            </div>

            {/* Node-Cron */}
            <div className="flex gap-4 p-5 glass rounded-3xl border border-brand-brown-200/10">
              <div className="w-10 h-10 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/30 text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center text-lg flex-shrink-0">
                <FiClock />
              </div>
              <div className="space-y-1">
                <h4 className="text-brand-brown-800 dark:text-brand-brown-200 font-bold">Automated Lifecycle</h4>
                <p className="text-xs text-brand-brown-600 dark:text-brand-brown-400 leading-relaxed">
                  An active crontab scheduler scans your parameters and closes elapsed deadlines every minute, protecting buyer and seller agreements.
                </p>
              </div>
            </div>

            {/* Rate Limiting */}
            <div className="flex gap-4 p-5 glass rounded-3xl border border-brand-brown-200/10">
              <div className="w-10 h-10 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/30 text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center text-lg flex-shrink-0">
                <FiBell />
              </div>
              <div className="space-y-1">
                <h4 className="text-brand-brown-800 dark:text-brand-brown-200 font-bold">Brute-Force & Bot Safety</h4>
                <p className="text-xs text-brand-brown-600 dark:text-brand-brown-400 leading-relaxed">
                  Layered rate-limiters applied separately across API authentication gateways and real-time custom bid submissions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* --------------------------------------------------------
     CASE B: RENDER SAAS DASHBOARD PAGE FOR LOGGED-IN USERS
     -------------------------------------------------------- */
  return (
    <div className="flex-1 w-full space-y-8">
      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-brand-brown-100/40 dark:bg-brand-brown-900/10 p-4 rounded-2xl border border-brand-brown-200/10">
        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-brown-500">
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
                  : "bg-brand-brown-100/60 text-brand-brown-600 hover:text-brand-teal-600 dark:bg-brand-brown-900/30 dark:text-brand-brown-300 dark:hover:text-brand-teal-400"
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
          <p className="text-sm text-brand-brown-600 dark:text-brand-brown-400">
            We ran into an issue syncing auctions. Please check your network or try refreshing.
          </p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl max-w-lg mx-auto border border-brand-brown-200/10">
          <p className="text-brand-brown-600 dark:text-brand-brown-200 font-bold text-lg mb-2">
            No Auctions Found
          </p>
          <p className="text-sm text-brand-brown-600 dark:text-brand-brown-400">
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
              const isUserOwnAuction = auction.createdBy === currentUserId;
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
                    
                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                      {isUserOwnAuction && (
                        <div className="bg-brand-brown-800/90 backdrop-blur-sm text-brand-brown-50 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shadow-sm">
                          👤 Your Auction
                        </div>
                      )}
                    </div>

                    {isClosed ? (
                      <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Closed
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 bg-brand-teal-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
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
                      <p className="text-xs text-brand-brown-600 dark:text-brand-brown-400 line-clamp-2 mt-1 font-semibold leading-relaxed">
                        {auction.desc}
                      </p>
                    </div>

                    {/* Timeline and Prices footer */}
                    <div className="pt-2 border-t border-brand-brown-200/10">
                      <div className="flex justify-between items-center text-xs text-brand-brown-600 dark:text-brand-brown-400 font-bold mb-2">
                        <span className="flex items-center gap-1 text-[11px]">
                          <FiCalendar /> {timeString}
                        </span>
                        <span className="text-[11px]">
                          Start: ${auction.askingPrice}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-brown-500">
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
          <span className="text-sm font-bold text-brand-brown-600 dark:text-brand-brown-400">
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
