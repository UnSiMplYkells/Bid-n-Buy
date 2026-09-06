"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "../store/useAuthStore";
import { FiSun, FiMoon, FiLogOut, FiPlus, FiGrid, FiUser, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, clearAuth } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    clearAuth();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const navLinks = [
    { href: "/", label: "Auctions", icon: FiGrid },
    { href: "/my-auctions", label: "My Listings", icon: FiPackage },
    { href: "/create-auction", label: "List Item", icon: FiPlus },
    { href: "/profile", label: "Profile", icon: FiUser },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3">
      <div className="mx-auto max-w-7xl glass rounded-2xl px-6 py-3 flex items-center justify-between transition-all shadow-md">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
            B
          </div>
          <span className="text-xl font-bold tracking-tight text-brand-teal-700 dark:text-brand-teal-400">
            Bid <span className="text-brand-brown-600 dark:text-brand-brown-300">'N</span> Buy
          </span>
        </Link>

        {/* Dynamic Navigation Links (Desktop) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 bg-brand-brown-100/50 dark:bg-brand-brown-900/30 p-1 rounded-xl">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-brand-teal-600 text-white shadow-sm"
                      : "text-brand-brown-500 hover:text-brand-teal-600 hover:bg-brand-brown-200/50 dark:text-brand-brown-300 dark:hover:text-brand-teal-400 dark:hover:bg-brand-brown-800/30"
                  }`}
                >
                  <Icon className="text-base" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Light/Dark Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 rounded-xl bg-brand-brown-100/60 hover:bg-brand-brown-200 dark:bg-brand-brown-900/40 dark:hover:bg-brand-brown-800/40 flex items-center justify-center text-brand-brown-600 dark:text-brand-brown-300 text-lg transition-transform hover:scale-105 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <FiSun /> : <FiMoon />}
            </button>
          )}

          {/* User Details & Logout */}
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="hidden lg:flex flex-col text-right hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="text-xs text-brand-brown-600 dark:text-brand-brown-400 font-semibold">
                  Welcome,
                </span>
                <span className="text-sm font-bold text-brand-teal-600 dark:text-brand-teal-400">
                  {user.username || user.email.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 text-lg transition-transform hover:scale-105 cursor-pointer"
                title="Logout"
              >
                <FiLogOut />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-sm font-bold text-brand-brown-600 hover:bg-brand-brown-100 dark:text-brand-brown-300 dark:hover:bg-brand-brown-900/30"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-sm font-bold bg-brand-teal-600 text-white hover:bg-brand-teal-500 shadow-sm"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sticky Mobile Navigation */}
      {user && (
        <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 glass rounded-2xl shadow-xl flex justify-around py-3 px-2 border border-brand-brown-200/20 dark:border-brand-brown-800/10">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-brand-teal-600 dark:text-brand-teal-400 scale-105"
                    : "text-brand-brown-400 hover:text-brand-teal-600 dark:text-brand-brown-400 dark:hover:text-brand-teal-400"
                }`}
              >
                <Icon className="text-xl" />
                <span className="text-[10px] font-bold tracking-tight">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
