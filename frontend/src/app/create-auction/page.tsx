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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Redirect if unauthenticated
  useEffect(() => {
    document.title = "Bid'n'Buy | List New Item";
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
    }) => {
      // Step 1: Create the auction text details
      const response = await axiosClient.post("/api/v1/auction/create", payload);
      const createdAuction = response.data.auction;

      // Step 2: Upload the selected image if present
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const uploadResponse = await axiosClient.post(
          `/api/v1/auction/${createdAuction._id}/images`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return uploadResponse.data;
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      router.push("/");
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

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return toast.error("Image file is too large! Maximum size allowed is 5MB.");
    }

    const payload = {
      name,
      desc,
      askingPrice: priceNum,
      endTime: new Date(endTime).toISOString(),
    };

    // Bind mutation to toast.promise
    toast.promise(
      mutation.mutateAsync(payload),
      {
        loading: "Listing item and uploading image...",
        success: "Auction item listed successfully! 🔥",
        error: (err) => err.response?.data?.msg || "Failed to create auction listing.",
      }
    );
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

          {/* Image File Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-brown-500 dark:text-brand-brown-400 block">
              Item Image (Optional)
            </label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-brand-brown-200/40 dark:border-brand-brown-800/40 rounded-3xl p-6 bg-brand-brown-100/20 dark:bg-brand-brown-900/10 hover:border-brand-teal-500/50 transition-colors relative group">
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-sm">
                  <img
                    src={imagePreview}
                    alt="Selected Item Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                    }}
                    className="absolute top-3 right-3 bg-red-600/95 hover:bg-red-500 text-white py-1.5 px-3 rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiImage className="w-10 h-10 text-brand-brown-400 mb-2 group-hover:text-brand-teal-500 transition-colors" />
                    <p className="text-sm font-semibold text-brand-brown-600 dark:text-brand-brown-300">
                      Click to upload cover image
                    </p>
                    <p className="text-xs text-brand-brown-400 mt-1">
                      PNG, JPG, WEBP (Max 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File is too large! Maximum size allowed is 5MB.");
                          return;
                        }
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              )}
            </div>
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
