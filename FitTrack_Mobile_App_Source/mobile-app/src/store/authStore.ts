import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

// Per the Technical Architecture Document (Section 6.2): tokens are never kept
// in AsyncStorage — expo-secure-store wraps the iOS Keychain / Android Keystore.

export type Role = "GYM_OWNER" | "GYM_STAFF" | "MEMBER" | "PLATFORM_ADMIN";

interface AuthUser {
  id: number;
  gymId: number | null; // null for the PLATFORM_ADMIN (no gym)
  name: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,

  hydrate: async () => {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync("accessToken"),
      SecureStore.getItemAsync("refreshToken"),
      SecureStore.getItemAsync("authUser"),
    ]);
    set({
      accessToken,
      refreshToken,
      user: userJson ? JSON.parse(userJson) : null,
      isHydrated: true,
    });
  },

  login: async (user, accessToken, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync("accessToken", accessToken),
      SecureStore.setItemAsync("refreshToken", refreshToken),
      SecureStore.setItemAsync("authUser", JSON.stringify(user)),
    ]);
    set({ user, accessToken, refreshToken });
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync("accessToken"),
      SecureStore.deleteItemAsync("refreshToken"),
      SecureStore.deleteItemAsync("authUser"),
    ]);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
