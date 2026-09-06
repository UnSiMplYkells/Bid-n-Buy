"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/useAuthStore";
import { axiosClient } from "../../../utils/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../../../hooks/useSocket";
import { motion, AnimatePresence } from "framer-motion";
import { FiDollarSign, FiClock, FiUser, FiInfo, FiTrendingUp, FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface AuctionDetail {
  _id: string;
  name: string;
  desc: string;
  askingPrice: number;
  currentPrice: number;
  endTime: string;
  image?: string;
  status: "active" | "closed";
  createdBy: string;
  highestBidder: string | null;
}

interface BidRecord {
  _id: string;
  amount: number;
  createdAt: string;
  bidder?: {
    username: string;
  };
}

export default function AuctionDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const currentUserId = user && (user as any)._id;

  const [bidAmount, setBidAmount] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Modal confirmation states
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmDetails, setConfirmDetails] = useState<{
    amount: number;
    percentage: string | null;
    increment: number | null;
  } | null>(null);

  // Establish WebSockets connection & subscribe to this specific auction room
  const socket = useSocket(id);

  // Check if unauthenticated and redirect
  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

  // Real-time WebSockets update handler
  useEffect(() => {
    if (!socket) return;

    socket.on("newBid", (data: { bid: any; auction: any }) => {
      // Invalidate queries to trigger an elegant cache refresh
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
      queryClient.invalidateQueries({ queryKey: ["bids-history", id] });
      
      // Notify the active viewer
      toast.success(`A new bid of $${data.bid.amount} was placed!`);
    });

    return () => {
      socket.off("newBid");
    };
  }, [socket, id, queryClient]);

  // Fetch single auction details
  const { data: auctionData, isLoading: isAuctionLoading, isError: isAuctionError } = useQuery({
    queryKey: ["auction", id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/v1/auction/${id}`);
      return response.data;
    },
    enabled: !!accessToken && !!id,
  });

  // Fetch bid history
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["bids-history", id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/v1/bid/history/${id}`);
      return response.data;
    },
    enabled: !!accessToken && !!id,
  });

  const auction: AuctionDetail | null = auctionData?.auction || null;
  const bids: BidRecord[] = historyData?.bids || [];

  // Countdown timer logic
  useEffect(() => {
    if (!auction) return;

    const interval = setInterval(() => {
      const difference = new Date(auction.endTime).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft("Auction Ended");
        setIsExpired(true);
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        let timeStr = "";
        if (days > 0) timeStr += `${days}d `;
        timeStr += `${hours.toString().padStart(2, "0")}h ${minutes
          .toString()
          .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;

        setTimeLeft(timeStr);
        setIsExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  // Bid placement mutation
  const bidMutation = useMutation({
    mutationFn: async (payload: { amount?: number; bidType?: string }) => {
      const response = await axiosClient.post(`/api/v1/bid/${id}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Your bid was placed successfully!");
      setBidAmount("");
      
      // Invalidate queries to reload details immediately
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
      queryClient.invalidateQueries({ queryKey: ["bids-history", id] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.msg || "Failed to place bid. Please retry.";
      toast.error(errorMsg);
    },
  });

  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(bidAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      return toast.error("Please enter a valid positive number");
    }

    if (auction && amountNum <= auction.currentPrice) {
      return toast.error(`Bid must be higher than current price of $${auction.currentPrice}`);
    }

    // Set confirmation data and trigger dialog
    setConfirmDetails({
      amount: amountNum,
      percentage: null,
      increment: null,
    });
    setIsConfirming(true);
  };

  const handlePercentageBid = (percentage: string) => {
    if (!auction) return;
    
    // Calculate percentage increment values precisely
    const pctVal = parseInt(percentage) / 100;
    const increment = Math.round((auction.currentPrice * pctVal) * 100) / 100;
    const finalAmount = Math.round((auction.currentPrice + increment) * 100) / 100;

    setConfirmDetails({
      amount: finalAmount,
      percentage,
      increment,
    });
    setIsConfirming(true);
  };

  const executeConfirmedBid = () => {
    if (!confirmDetails) return;
    
    if (confirmDetails.percentage) {
      bidMutation.mutate({ bidType: confirmDetails.percentage });
    } else {
      bidMutation.mutate({ amount: confirmDetails.amount });
    }
    
    setIsConfirming(false);
    setConfirmDetails(null);
  };

  if (isAuctionLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-teal-500 border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-brand-brown-600 dark:text-brand-brown-400">Loading auction details...</p>
      </div>
    );
  }

  if (isAuctionError || !auction) {
    return (
      <div className="text-center py-12 glass rounded-3xl max-w-lg mx-auto border border-red-500/10 mt-10">
        <p className="text-red-500 font-bold text-lg mb-2">Listing Not Found</p>
        <p className="text-sm text-brand-brown-600 dark:text-brand-brown-400 mb-6 font-semibold">
          The auction listing with given ID does not exist or has been deleted.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 bg-brand-teal-600 text-white font-bold rounded-xl shadow-md text-sm hover:bg-brand-teal-500"
        >
          Return to Auctions
        </button>
      </div>
    );
  }

  const isOwner = auction.createdBy.toString() === currentUserId;
  const isAuctionClosed = auction.status === "closed" || isExpired;
  const isWinner = isAuctionClosed && auction.highestBidder === currentUserId;

  return (
    <div className="flex-1 w-full space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2 text-sm font-bold text-brand-brown-700 hover:text-brand-teal-600 dark:text-brand-brown-300 dark:hover:text-brand-teal-400 transition-colors cursor-pointer group"
      >
        <FiArrowLeft className="transition-transform group-hover:-translate-x-1" /> Revert to Feed
      </button>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Product Image & Desc */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="glass rounded-3xl p-4 border border-brand-brown-200/10 shadow-sm overflow-hidden">
            <div className="relative w-full h-[320px] md:h-[420px] rounded-2xl overflow-hidden bg-brand-brown-100 dark:bg-brand-brown-900/40">
              <img
                src={auction.image || "https://th.bing.com/th/id/OIP.3SwljyV2T5JnvEqkwrZMfQHaHa?w=156&h=180&c=7&r=0&o=7&pid=1.7&rm=3"}
                alt={auction.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="glass rounded-3xl p-6 border border-brand-brown-200/10 space-y-3 shadow-sm">
            <h3 className="text-sm uppercase tracking-wider font-extrabold text-brand-teal-600 dark:text-brand-teal-400">
              Description
            </h3>
            <p className="text-sm font-semibold text-brand-brown-700 dark:text-brand-brown-300 leading-relaxed">
              {auction.desc}
            </p>
          </div>
        </motion.div>

        {/* Right Side: Price Widget, Form, & Bid History */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Winner Congratulations Card */}
          {isWinner && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500/30 rounded-3xl p-6 text-center space-y-2 shadow-lg"
            >
              <h2 className="text-xl font-extrabold text-amber-700 dark:text-amber-400 animate-pulse">
                🎉 Congratulations!
              </h2>
              <p className="text-sm font-bold text-brand-brown-700 dark:text-brand-brown-200">
                You won this auction! The item is yours for <span className="font-extrabold text-brand-teal-600 dark:text-brand-teal-400">${auction.currentPrice}</span>.
              </p>
            </motion.div>
          )}

          {/* Main Info Card */}
          <div className="glass rounded-3xl p-6 border border-brand-brown-200/10 space-y-6 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <h1 className="text-2xl font-bold text-brand-brown-800 dark:text-brand-brown-200 leading-tight">
                  {auction.name}
                </h1>
                {isOwner && (
                  <span className="bg-brand-brown-100 dark:bg-brand-brown-900/50 text-brand-brown-700 dark:text-brand-brown-300 text-[10px] font-extrabold px-2.5 py-1 rounded-md">
                    👤 Your Auction
                  </span>
                )}
              </div>
              <span className="inline-block mt-2 bg-brand-brown-100/50 dark:bg-brand-brown-900/30 text-brand-brown-600 dark:text-brand-brown-300 text-xs font-bold px-3 py-1 rounded-md">
                Listing ID: {auction._id}
              </span>
            </div>

            {/* Timers and Prices Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-brown-200/10">
              {/* Price */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-brown-500 dark:text-brand-brown-400">
                  Current Price
                </span>
                <div className="text-3xl font-extrabold text-brand-teal-600 dark:text-brand-teal-400 flex items-center">
                  <FiDollarSign className="text-xl" />
                  {auction.currentPrice}
                </div>
                <span className="text-[10px] font-bold text-brand-brown-600 dark:text-brand-brown-400 block">
                  Starting Ask: ${auction.askingPrice}
                </span>
              </div>

              {/* Time Left */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-brown-500 dark:text-brand-brown-400">
                  Time Remaining
                </span>
                <div
                  className={`text-xl font-extrabold flex items-center gap-1.5 ${
                    isAuctionClosed
                      ? "text-red-500"
                      : "text-brand-brown-700 dark:text-brand-brown-200"
                  }`}
                >
                  <FiClock />
                  {timeLeft || "Calculating..."}
                </div>
                <span className="text-[10px] font-bold text-brand-brown-600 dark:text-brand-brown-400 block leading-tight">
                  Ends: {new Date(auction.endTime).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bidding Interactivity Form */}
            {isAuctionClosed ? (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-500/10 rounded-2xl p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
                <FiInfo className="text-xl flex-shrink-0" />
                <span className="text-xs font-bold">
                  This auction listing has officially closed. Bidding is no longer active.
                </span>
              </div>
            ) : isOwner ? (
              <div className="bg-brand-brown-100/50 dark:bg-brand-brown-900/30 border border-brand-brown-200/10 rounded-2xl p-4 flex items-center gap-3 text-brand-brown-700 dark:text-brand-brown-300">
                <FiInfo className="text-xl flex-shrink-0" />
                <span className="text-xs font-bold">
                  You are the creator of this auction listing. You cannot bid on your own item.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-brand-teal-600 dark:text-brand-teal-400">
                  Place Your Bid
                </h3>
                {/* Percentage options */}
                <div className="flex gap-2">
                  {["5%", "10%", "20%"].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePercentageBid(pct)}
                      disabled={bidMutation.isPending}
                      className="flex-1 py-2 rounded-xl bg-brand-brown-100/60 hover:bg-brand-teal-50 hover:text-brand-teal-600 dark:bg-brand-brown-900/30 dark:hover:bg-brand-teal-950/20 dark:hover:text-brand-teal-400 text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50"
                    >
                      +{pct} Price
                    </button>
                  ))}
                </div>

                {/* Custom Bid Form */}
                <form onSubmit={handleCustomBid} className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-brown-500 dark:text-brand-brown-400">
                      <FiDollarSign />
                    </div>
                    <input
                      type="number"
                      step="any"
                      required
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Enter higher than ${auction.currentPrice}`}
                      className="w-full bg-brand-brown-100/40 hover:bg-brand-brown-100 dark:bg-brand-brown-900/20 dark:hover:bg-brand-brown-900/40 pl-10 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold text-brand-brown-700"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={bidMutation.isPending}
                    className="bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold px-6 rounded-2xl shadow-md text-sm cursor-pointer transition-all disabled:opacity-50"
                  >
                    {bidMutation.isPending ? "Placing..." : "Place Bid"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Historical Bid Records */}
          <div className="glass rounded-3xl p-6 border border-brand-brown-200/10 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-brown-200/10 pb-3">
              <h3 className="text-sm font-extrabold text-brand-brown-800 dark:text-brand-brown-200 flex items-center gap-1.5">
                <FiTrendingUp /> Live Bidding Feed
              </h3>
              <span className="bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-600 dark:text-brand-teal-400 text-[10px] font-bold px-2.5 py-1 rounded-md">
                {bids.length} total bids
              </span>
            </div>

            {/* Lists view */}
            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
              <AnimatePresence initial={false}>
                {bids.length === 0 ? (
                  <p className="text-center py-6 text-xs font-semibold text-brand-brown-600 dark:text-brand-brown-400">
                    No bids have been placed yet. Be the first to start the battle!
                  </p>
                ) : (
                  bids
                    .slice()
                    .reverse()
                    .map((bid, idx) => (
                      <motion.div
                        key={bid._id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex justify-between items-center px-4 py-3 rounded-2xl text-xs font-semibold ${
                          idx === 0
                            ? "bg-brand-teal-50/50 dark:bg-brand-teal-950/20 border border-brand-teal-500/20"
                            : "bg-brand-brown-100/30 dark:bg-brand-brown-900/10"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold ${
                              idx === 0
                                ? "bg-brand-teal-600 text-white"
                                : "bg-brand-brown-200 text-brand-brown-600 dark:bg-brand-brown-800 dark:text-brand-brown-300"
                            }`}
                          >
                            {idx === 0 ? "🏆" : `#${bids.length - idx}`}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-brand-brown-700 dark:text-brand-brown-200 font-bold">
                              {bid.bidder?.username || "Anonymity"}
                            </span>
                            <span className="text-[10px] text-brand-brown-500 dark:text-brand-brown-400 leading-tight font-bold">
                              {formatDistanceToNow(new Date(bid.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-brand-teal-600 dark:text-brand-teal-400">
                          ${bid.amount}
                        </span>
                      </motion.div>
                    ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Custom Bid Confirmation Modal */}
      <AnimatePresence>
        {isConfirming && confirmDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Dark blur backdrop (Locked backdrop click) */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal Card Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md p-6 bg-brand-brown-50 dark:bg-brand-brown-900 border border-brand-brown-200 dark:border-brand-brown-800 rounded-3xl shadow-2xl space-y-6 mx-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl flex-shrink-0">
                  <FiAlertTriangle />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-brown-800 dark:text-brand-brown-200">
                    Confirm Your Bid
                  </h3>
                  <p className="text-xs text-brand-brown-600 dark:text-brand-brown-400 font-semibold">
                    Please review your transaction before submitting.
                  </p>
                </div>
              </div>

              {/* Mathematical breakdown */}
              <div className="bg-brand-brown-100/50 dark:bg-brand-brown-900/20 p-4 rounded-2xl border border-brand-brown-200/10 space-y-2 text-xs font-semibold text-brand-brown-700 dark:text-brand-brown-300">
                <div className="flex justify-between">
                  <span>Current Price:</span>
                  <span>${auction.currentPrice}</span>
                </div>
                {confirmDetails.percentage && (
                  <div className="flex justify-between text-brand-teal-600 dark:text-brand-teal-400">
                    <span>Added Increment ({confirmDetails.percentage}):</span>
                    <span>+${confirmDetails.increment}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-brand-brown-200/10 pt-2 text-sm font-extrabold text-brand-brown-800 dark:text-brand-brown-200">
                  <span>New Total Auction Price:</span>
                  <span className="text-brand-teal-700 dark:text-brand-teal-400">${confirmDetails.amount}</span>
                </div>
              </div>

              <p className="text-xs font-semibold text-brand-brown-500 dark:text-brand-brown-400">
                Are you sure you want to commit this bid? Bids cannot be canceled or retracted once placed.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsConfirming(false);
                    setConfirmDetails(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedBid}
                  className="px-5 py-2.5 rounded-xl bg-brand-brown-600 hover:bg-brand-brown-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Confirm Bid
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
