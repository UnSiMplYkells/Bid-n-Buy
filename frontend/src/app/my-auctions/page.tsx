"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { axiosClient } from "../../utils/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FiPackage, FiGrid, FiClock, FiDollarSign, FiTrash2, FiSlash, FiPlus } from "react-icons/fi";
import Link from "next/link";
import toast from "react-hot-toast";

interface UserAuction {
  _id: string;
  name: string;
  desc: string;
  askingPrice: number;
  currentPrice: number;
  endTime: string;
  image?: string;
  status: "active" | "closed";
}

export default function MyAuctionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

  // Fetch auctions listed by user
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-auctions"],
    queryFn: async () => {
      const response = await axiosClient.get("/api/v1/auction/user/all");
      return response.data;
    },
    enabled: !!accessToken,
  });

  // Manual close auction mutation
  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosClient.post(`/api/v1/auction/${id}/close`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Auction closed early successfully!");
      queryClient.invalidateQueries({ queryKey: ["user-auctions"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.msg || "Failed to close auction early");
    },
  });

  // Delete auction mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosClient.delete(`/api/v1/auction/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Auction deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["user-auctions"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.msg || "Failed to delete auction");
    },
  });

  if (!accessToken) return null;

  const auctions: UserAuction[] = data?.auctions || [];

  return (
    <div className="flex-1 w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-brown-100/40 dark:bg-brand-brown-900/10 p-6 rounded-3xl border border-brand-brown-200/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/30 text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center text-xl">
            <FiPackage />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-brown-800 dark:text-brand-brown-200">
              My Auction Listings
            </h1>
            <p className="text-xs text-brand-brown-400 dark:text-brand-brown-400 font-semibold">
              Manage and close the live auction items you have published.
            </p>
          </div>
        </div>
        <Link
          href="/create-auction"
          className="flex items-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <FiPlus /> List New Item
        </Link>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="glass rounded-3xl p-5 space-y-4 animate-pulse border border-brand-brown-200/10"
            >
              <div className="w-full h-48 bg-brand-brown-200 dark:bg-brand-brown-800 rounded-2xl" />
              <div className="h-6 w-3/4 bg-brand-brown-200 dark:bg-brand-brown-800 rounded-md" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-8 w-1/3 bg-brand-brown-200 dark:bg-brand-brown-800 rounded-md" />
                <div className="h-10 w-1/4 bg-brand-brown-200 dark:bg-brand-brown-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 glass rounded-3xl p-8 max-w-lg mx-auto border border-red-500/10">
          <p className="text-red-500 font-semibold mb-2">Error Loading Listings</p>
          <p className="text-sm text-brand-brown-400 dark:text-brand-brown-400">
            We had an issue retrieving your auction list. Please refresh.
          </p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl max-w-lg mx-auto border border-brand-brown-200/10">
          <p className="text-brand-brown-600 dark:text-brand-brown-200 font-bold text-lg mb-2">
            No Published Listings
          </p>
          <p className="text-sm text-brand-brown-400 dark:text-brand-brown-400 mb-6 font-semibold">
            You haven't listed any items for auction yet. Start listing now!
          </p>
          <Link
            href="/create-auction"
            className="inline-flex items-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold px-5 py-3 rounded-2xl shadow-md text-sm cursor-pointer"
          >
            <FiPlus /> List Your First Item
          </Link>
        </div>
      ) : (
        /* Auctions Grid */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {auctions.map((auction) => {
              const isActive = auction.status === "active";
              return (
                <motion.div
                  key={auction._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="glass rounded-3xl p-5 border border-brand-brown-200/10 shadow-sm flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    {/* Item Image */}
                    <div
                      onClick={() => router.push(`/auction/${auction._id}`)}
                      className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 bg-brand-brown-100 dark:bg-brand-brown-900/50 cursor-pointer"
                    >
                      <img
                        src={auction.image || "https://th.bing.com/th/id/OIP.3SwljyV2T5JnvEqkwrZMfQHaHa?w=156&h=180&c=7&r=0&o=7&pid=1.7&rm=3"}
                        alt={auction.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                      />
                      {isActive ? (
                        <div className="absolute top-3 right-3 bg-brand-teal-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <FiClock /> Active
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Closed
                        </div>
                      )}
                    </div>

                    {/* Item Content */}
                    <div
                      onClick={() => router.push(`/auction/${auction._id}`)}
                      className="cursor-pointer space-y-1.5"
                    >
                      <h3 className="text-base font-bold text-brand-brown-800 dark:text-brand-brown-200 line-clamp-1 group-hover:text-brand-teal-600 dark:group-hover:text-brand-teal-400 transition-colors">
                        {auction.name}
                      </h3>
                      <p className="text-xs text-brand-brown-400 line-clamp-2 leading-relaxed">
                        {auction.desc}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Info */}
                  <div className="pt-2 border-t border-brand-brown-200/10 space-y-3">
                    <div className="flex justify-between items-center text-xs text-brand-brown-400">
                      <span className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold">
                          Ask Price
                        </span>
                        <span className="text-sm font-extrabold text-brand-brown-700 dark:text-brand-brown-300">
                          ${auction.askingPrice}
                        </span>
                      </span>
                      <span className="flex flex-col text-right">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold">
                          Current Price
                        </span>
                        <span className="text-sm font-extrabold text-brand-teal-600 dark:text-brand-teal-400">
                          ${auction.currentPrice}
                        </span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1.5">
                      {isActive ? (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to close this auction early?")) {
                              closeMutation.mutate(auction._id);
                            }
                          }}
                          disabled={closeMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1 bg-brand-brown-100 hover:bg-brand-brown-200 dark:bg-brand-brown-900/30 dark:hover:bg-brand-brown-800/40 text-brand-brown-700 dark:text-brand-brown-300 py-2.5 px-3 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                        >
                          <FiSlash /> Close Early
                        </button>
                      ) : (
                        <div className="flex-1 text-center py-2.5 bg-brand-brown-100/30 text-brand-brown-400 text-xs font-bold rounded-xl border border-brand-brown-200/10">
                          Auction Completed
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this listing?")) {
                            deleteMutation.mutate(auction._id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="w-11 h-11 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-sm cursor-pointer transition-all disabled:opacity-50"
                        title="Delete Listing"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
