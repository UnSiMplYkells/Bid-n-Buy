"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { axiosClient } from "../../utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FiTag, FiFileText, FiDollarSign, FiClock, FiImage, FiPlusCircle } from "react-icons/fi";
import toast from "react-hot-toast";

export default function CreateAuctionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [endTime, setEndTime] = useState("");
  const [image, setImage] = useState("");

  // Redirect if unauthenticated
  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

  const mutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      desc: string;
      askingPrice: number;
      endTime: string;
      image?: string;
    }) => {
      const response = await axiosClient.post("/api/v1/auction/create", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Auction item listed successfully! 🔥");
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      router.push("/");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.msg || "Failed to create auction listing. Please check details.";
      toast.error(errorMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !desc || !askingPrice || !endTime) {
      return toast.error("Please fill out all required fields");
    }

    const priceNum = parseFloat(askingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return toast.error("Please enter a valid positive starting price");
    }

    if (new Date(endTime) <= new Date()) {
      return toast.error("End time must be in the future");
    }

    const payload: any = {
      name,
      desc,
      askingPrice: priceNum,
      endTime: new Date(endTime).toISOString(),
    };

    if (image) {
      payload.image = image;
    }

    mutation.mutate(payload);
  };

  if (!accessToken) return null;

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 border border-brand-brown-200/10 shadow-xl"
      >
        <div className="flex items-center gap-3 border-b border-brand-brown-200/10 pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/30 text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center text-xl">
            <FiPlusCircle />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-brown-800 dark:text-brand-brown-200">
              Create Auction Listing
            </h1>
            <p className="text-xs text-brand-brown-400 dark:text-brand-brown-400 font-semibold">
              Fill out the details below to list your item for live bidding.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Name */}
          <div className="relative">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1.5 block">
              Item Name *
            </label>
            <div className="absolute inset-y-11 left-4 flex items-center pointer-events-none text-brand-brown-400">
              <FiTag />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vintage Leather Jacket"
              className="w-full bg-brand-brown-100/40 hover:bg-brand-brown-100 dark:bg-brand-brown-900/20 dark:hover:bg-brand-brown-900/40 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
            />
          </div>

          {/* Description */}
          <div className="relative">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1.5 block">
              Description *
            </label>
            <div className="absolute top-11 left-4 flex items-start pointer-events-none text-brand-brown-400 mt-3.5">
              <FiFileText />
            </div>
            <textarea
              required
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Provide a detailed description of the item's condition, origin, size, etc."
              className="w-full bg-brand-brown-100/40 hover:bg-brand-brown-100 dark:bg-brand-brown-900/20 dark:hover:bg-brand-brown-900/40 pl-11 pr-4 py-3.5 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold resize-none"
            />
          </div>

          {/* Price & End Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Starting Price */}
            <div className="relative">
              <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1.5 block">
                Starting Price ($) *
              </label>
              <div className="absolute inset-y-11 left-4 flex items-center pointer-events-none text-brand-brown-400">
                <FiDollarSign />
              </div>
              <input
                type="number"
                step="any"
                required
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-brand-brown-100/40 hover:bg-brand-brown-100 dark:bg-brand-brown-900/20 dark:hover:bg-brand-brown-900/40 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
              />
            </div>

            {/* End Time */}
            <div className="relative">
              <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1.5 block">
                Auction End Time *
              </label>
              <div className="absolute inset-y-11 left-4 flex items-center pointer-events-none text-brand-brown-400">
                <FiClock />
              </div>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-brand-brown-100/40 hover:bg-brand-brown-100 dark:bg-brand-brown-900/20 dark:hover:bg-brand-brown-900/40 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="relative">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 mb-1.5 block">
              Image URL (Optional)
            </label>
            <div className="absolute inset-y-11 left-4 flex items-center pointer-events-none text-brand-brown-400">
              <FiImage />
            </div>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/vintage-item.jpg"
              className="w-full bg-brand-brown-100/40 hover:bg-brand-brown-100 dark:bg-brand-brown-900/20 dark:hover:bg-brand-brown-900/40 pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-sm transition-all font-semibold"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full mt-4 flex items-center justify-center bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? "Listing Item..." : "Publish Auction Listing"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
