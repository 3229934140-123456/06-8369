import { create } from 'zustand';
import type { User } from '@shared/types.js';
import { authApi } from '../lib/api.js';

interface UserState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setUser: (u: User | null) => void;
  init: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { user } = await authApi.login(email, password);
      set({ user, loading: false });
      return user;
    } finally {
      set({ loading: false });
    }
  },
  logout: () => {
    authApi.logout();
    set({ user: null });
  },
  setUser: (u) => set({ user: u }),
  init: async () => {
    if (!authApi.isLoggedIn()) { set({ initialized: true, user: null }); return; }
    try {
      const u = await authApi.me();
      set({ user: u, initialized: true });
    } catch {
      authApi.logout();
      set({ user: null, initialized: true });
    }
  },
}));
