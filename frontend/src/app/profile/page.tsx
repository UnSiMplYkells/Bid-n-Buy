"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { axiosClient } from "../../utils/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiSettings, FiGrid, FiAward, FiDollarSign, FiTrash2, FiUpload } from "react-icons/fi";
import toast from "react-hot-toast";

interface BidOnAuction {
  _id: string;
  amount: number;
  auction: {
    _id: string;
    name: string;
    image?: string;
    currentPrice: number;
    status: "active" | "closed";
  };
}

interface WonAuction {
  _id: string;
  name: string;
  desc: string;
  currentPrice: number;
  image?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [activeTab, setActiveTab] = useState<"bids" | "wins">("bids");
  const [isEditing, setIsEditing] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    document.title = "Bid'n'Buy | Profile";
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

  // Sync state values with store on mount/user change
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setPhoneNumber(user.phoneNumber || "");
    }
  }, [user]);

  // Query: retrieve profile, active bids, and won bids in parallel
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-profile-data"],
    queryFn: async () => {
      const response = await axiosClient.get("/api/v1/user/me");
      return response.data;
    },
    enabled: !!accessToken,
  });

  const userProfile = data?.userProfile || user;

  // Profile update mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: { username: string; phoneNumber?: string }) => {
      const response = await axiosClient.post("/api/v1/user/me", payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      
      // Update global Zustand auth store user details
      updateUser(data.profile);
      
      // Reload profile data cache
      queryClient.invalidateQueries({ queryKey: ["user-profile-data"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.msg || "Failed to update profile details");
    },
  });

  // Upload picture mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axiosClient.post(
        `/api/v1/user/${userProfile?._id}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["user-profile-data"] });
    },
  });

  // Delete picture mutation
  const deleteImageMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosClient.delete(`/api/v1/user/${userProfile?._id}/images`);
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["user-profile-data"] });
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username) {
      return toast.error("Username is required");
    }

    const payload: any = { username };
    if (phoneNumber) payload.phoneNumber = phoneNumber;

    updateMutation.mutate(payload);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error("File is too large! Maximum size allowed is 5MB.");
      }

      const uploadPromise = uploadImageMutation.mutateAsync(file);

      toast.promise(
        uploadPromise,
        {
          loading: "Uploading profile picture...",
          success: "Profile picture updated successfully!",
          error: (err) => err.response?.data?.msg || "Failed to upload profile picture.",
        }
      );
    }
  };

  const handleDeletePhotoClick = () => {
    if (confirm("Are you sure you want to remove your profile picture?")) {
      const deletePromise = deleteImageMutation.mutateAsync();

      toast.promise(
        deletePromise,
        {
          loading: "Removing profile picture...",
          success: "Profile picture removed successfully!",
          error: (err) => err.response?.data?.msg || "Failed to remove profile picture.",
        }
      );
    }
  };

  if (!accessToken) return null;

  const currentBids: BidOnAuction[] = data?.userCurrentBids || [];
  const wonAuctions: WonAuction[] = data?.userWins || [];

  return (
    <div className="flex-1 w-full space-y-8 py-4 max-w-5xl mx-auto">
      {/* Top Profile Card */}
      <div className="glass rounded-3xl p-6 md:p-8 border border-brand-brown-200/10 shadow-md flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden bg-brand-brown-100 border-2 border-brand-teal-500/20 shadow-sm group">
            <img
              src={userProfile?.image || "https://tse1.explicit.bing.net/th/id/OIP.nNcZCmS6bYcpZXN7AimcNwHaGI?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"}
              alt="Profile Avatar"
              className="w-full h-full object-cover"
            />
            {/* Overlay */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold cursor-pointer gap-1"
            >
              <FiUpload className="text-base" />
              <span>Change Photo</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageFileChange}
            />
          </div>
          
          {/* Photo Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadImageMutation.isPending}
              className="px-2.5 py-1.5 rounded-lg bg-brand-teal-50 hover:bg-brand-teal-100 dark:bg-brand-teal-950/20 dark:hover:bg-brand-teal-950/40 text-[10px] font-extrabold text-brand-teal-600 dark:text-brand-teal-400 uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all"
            >
              <FiUpload /> Change
            </button>
            {userProfile?.image && userProfile.image !== "https://tse1.explicit.bing.net/th/id/OIP.nNcZCmS6bYcpZXN7AimcNwHaGI?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" && (
              <button
                onClick={handleDeletePhotoClick}
                disabled={deleteImageMutation.isPending}
                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all"
              >
                <FiTrash2 /> Remove
              </button>
            )}
          </div>
        </div>

        {/* Info Grid / Edit Form Toggle */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex justify-between items-center border-b border-brand-brown-200/10 pb-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-brand-brown-800 dark:text-brand-brown-200">
                {userProfile?.username || "JohnDoe"}
              </h1>
              <p className="text-xs text-brand-brown-400 font-semibold">{userProfile?.email}</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-brown-100 hover:bg-brand-brown-200 dark:bg-brand-brown-900/30 dark:hover:bg-brand-brown-800/40 text-xs font-bold text-brand-brown-600 dark:text-brand-brown-300 transition-colors cursor-pointer"
            >
              <FiSettings /> {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isEditing ? (
              /* Editable Profile Form */
              <motion.form
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                onSubmit={handleUpdateProfile}
                className="space-y-4 pt-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username Input */}
                  <div className="relative">
                    <label className="text-[10px] font-bold text-brand-brown-400 mb-1 block uppercase tracking-wider">
                      Username *
                    </label>
                    <div className="absolute inset-y-8 left-3.5 flex items-center pointer-events-none text-brand-brown-400">
                      <FiUser />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-brand-brown-100/40 hover:bg-brand-brown-100 dark:bg-brand-brown-900/20 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-xs transition-all font-semibold"
                    />
                  </div>

                  {/* Phone Number Input */}
                  <div className="relative">
                    <label className="text-[10px] font-bold text-brand-brown-400 mb-1 block uppercase tracking-wider">
                      Phone Number
                    </label>
                    <div className="absolute inset-y-8 left-3.5 flex items-center pointer-events-none text-brand-brown-400">
                      <FiPhone />
                    </div>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Not specified"
                      className="w-full bg-brand-brown-100/40 hover:bg-brand-brown-100 dark:bg-brand-brown-900/20 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-brand-teal-500 focus:bg-background outline-none text-xs transition-all font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2 bg-brand-teal-600 hover:bg-brand-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </motion.form>
            ) : (
              /* Profile Details Grid View */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5 bg-brand-brown-100/30 dark:bg-brand-brown-900/10 px-4 py-3 rounded-2xl">
                  <FiMail className="text-sm text-brand-brown-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-brand-brown-400 leading-none">Email</span>
                    <span className="text-brand-brown-700 dark:text-brand-brown-200 mt-0.5">
                      {userProfile?.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-brand-brown-100/30 dark:bg-brand-brown-900/10 px-4 py-3 rounded-2xl">
                  <FiPhone className="text-sm text-brand-brown-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-brand-brown-400 leading-none">Phone</span>
                    <span className="text-brand-brown-700 dark:text-brand-brown-200 mt-0.5">
                      {userProfile?.phoneNumber || "Not specified"}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="space-y-6">
        <div className="flex gap-4 border-b border-brand-brown-200/10 pb-1">
          <button
            onClick={() => setActiveTab("bids")}
            className={`flex items-center gap-1.5 pb-2.5 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "bids"
                ? "border-brand-teal-600 text-brand-teal-600 dark:border-brand-teal-400 dark:text-brand-teal-400"
                : "border-transparent text-brand-brown-400 hover:text-brand-teal-600"
            }`}
          >
            <FiGrid /> Active Bids ({currentBids.length})
          </button>
          <button
            onClick={() => setActiveTab("wins")}
            className={`flex items-center gap-1.5 pb-2.5 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "wins"
                ? "border-brand-teal-600 text-brand-teal-600 dark:border-brand-teal-400 dark:text-brand-teal-400"
                : "border-transparent text-brand-brown-400 hover:text-brand-teal-600"
            }`}
          >
            <FiAward /> Won Auctions ({wonAuctions.length})
          </button>
        </div>

        {/* Tab Lists Container */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="text-center py-12 text-sm font-bold text-brand-brown-400">
              Syncing lists...
            </div>
          ) : activeTab === "bids" ? (
            /* Active Bids List */
            <motion.div
              key="bids-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {currentBids.length === 0 ? (
                <div className="col-span-full text-center py-12 glass rounded-3xl border border-brand-brown-200/10">
                  <p className="text-brand-brown-600 dark:text-brand-brown-200 font-bold text-sm mb-1">
                    No Active Bids
                  </p>
                  <p className="text-xs text-brand-brown-400">
                    You haven't placed bids on any active auction listings yet.
                  </p>
                </div>
              ) : (
                currentBids.map((bid) => (
                  <div
                    key={bid._id}
                    onClick={() => router.push(`/auction/${bid.auction._id}`)}
                    className="glass rounded-2xl p-4 border border-brand-brown-200/10 flex items-center justify-between hover:border-brand-teal-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-brown-100">
                        <img
                          src={bid.auction.image || "https://th.bing.com/th/id/OIP.3SwljyV2T5JnvEqkwrZMfQHaHa?w=156&h=180&c=7&r=0&o=7&pid=1.7&rm=3"}
                          alt={bid.auction.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-brand-brown-800 dark:text-brand-brown-200 line-clamp-1 group-hover:text-brand-teal-600 transition-colors">
                          {bid.auction.name}
                        </h4>
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded mt-1 inline-block">
                          Active Bid
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-brown-400 block leading-none">
                        Your Bid
                      </span>
                      <span className="text-sm font-extrabold text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-end mt-1">
                        <FiDollarSign />
                        {bid.amount}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            /* Won Auctions List */
            <motion.div
              key="wins-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {wonAuctions.length === 0 ? (
                <div className="col-span-full text-center py-12 glass rounded-3xl border border-brand-brown-200/10">
                  <p className="text-brand-brown-600 dark:text-brand-brown-200 font-bold text-sm mb-1">
                    No Wins Yet
                  </p>
                  <p className="text-xs text-brand-brown-400">
                    Your won auctions listings will appear here once active listings end.
                  </p>
                </div>
              ) : (
                wonAuctions.map((auction) => (
                  <div
                    key={auction._id}
                    onClick={() => router.push(`/auction/${auction._id}`)}
                    className="glass rounded-2xl p-4 border border-brand-brown-200/10 flex items-center justify-between hover:border-brand-teal-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-brown-100">
                        <img
                          src={auction.image || "https://th.bing.com/th/id/OIP.3SwljyV2T5JnvEqkwrZMfQHaHa?w=156&h=180&c=7&r=0&o=7&pid=1.7&rm=3"}
                          alt={auction.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-brand-brown-800 dark:text-brand-brown-200 line-clamp-1 group-hover:text-brand-teal-600 transition-colors">
                          {auction.name}
                        </h4>
                        <span className="text-[10px] bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded mt-1 inline-block">
                          🏆 Won Listing
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-brown-400 block leading-none">
                        Won Price
                      </span>
                      <span className="text-sm font-extrabold text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-end mt-1">
                        <FiDollarSign />
                        {auction.currentPrice}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
