import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  email: string;
  username?: string;
  image?: string;
  phoneNumber?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string) => void;
  updateUser: (profile: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      updateUser: (profile) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...profile } : null,
        })),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "bid-n-buy-auth", // unique name inside localStorage
    }
  )
);
