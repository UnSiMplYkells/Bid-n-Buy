"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const SOCKET_BASE_URL = "https://bid-n-buy.onrender.com";

export function useSocket(auctionId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const user = useAuthStore((state) => state.user);

  // Custom hook gets current user from store
  const userId = user && (user as any)._id;

  useEffect(() => {
    // Initialize socket connection
    const socket = io(SOCKET_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Socket.io server");

      // If user is authenticated, join their private notifications room
      if (userId) {
        socket.emit("joinUserRoom", userId);
      }

      // If active auction detail page, join the specific listing room
      if (auctionId) {
        socket.emit("joinAuction", auctionId);
      }
    });

    // Listen for outbid notifications globally
    socket.on("outbid", (data: { auctionName: string; currentPrice: number; message: string }) => {
      
      toast.custom(
        (t) => {
          // Moved toastClass INSIDE the callback so it can access 't.visible'
          const toastClass = `${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-brand-brown-50 dark:bg-brand-brown-900 border border-brand-brown-200 dark:border-brand-brown-800 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`;

          return (
            <div className={toastClass}>
              <div className="flex-1 w-0">
                <div className="flex items-start">
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold text-brand-teal-700 dark:text-brand-teal-400">
                      Outbid Alert! 🚨
                    </p>
                    <p className="mt-1 text-xs text-brand-brown-500 dark:text-brand-brown-300">
                      {data.message} New Price: <span className="font-bold">${data.currentPrice}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-brand-brown-200 dark:border-brand-brown-800 ml-4 pl-4 items-center">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-xs font-bold text-brand-teal-600 hover:text-brand-teal-500 dark:text-brand-teal-400"
                >
                  Close
                </button>
              </div>
            </div>
          );
        },
        { id: `outbid-${data.auctionName}` }
      );
    });

    return () => {
      if (socket) {
        if (auctionId) {
          socket.emit("leaveAuction", auctionId);
        }
        socket.disconnect();
      }
    };
  }, [auctionId, userId]);

  return socketRef.current;
}