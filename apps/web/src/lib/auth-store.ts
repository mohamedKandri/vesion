'use client';

import { create } from 'zustand';
import { api, tokenStore } from './api';
import type { User } from './types';

interface LoginResponse {
  twoFactorRequired?: boolean;
  tokens?: { accessToken: string; refreshToken: string; expiresIn: number };
  user?: User;
}

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string, twoFactorCode?: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',

  async login(email, password, twoFactorCode) {
    const result = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
      twoFactorCode,
    });
    if (result.tokens && result.user) {
      tokenStore.set(result.tokens.accessToken, result.tokens.refreshToken);
      set({ user: result.user, status: 'authenticated' });
    }
    return result;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // best effort — clear local state regardless
    }
    tokenStore.clear();
    set({ user: null, status: 'unauthenticated' });
  },

  /** Restores the session on first load using the stored/cookie refresh token. */
  async bootstrap() {
    if (get().status === 'loading' || get().status === 'authenticated') return;
    set({ status: 'loading' });
    try {
      const user = await api.get<User>('/auth/me');
      set({ user, status: 'authenticated' });
    } catch {
      tokenStore.clear();
      set({ user: null, status: 'unauthenticated' });
    }
  },

  async refreshUser() {
    try {
      const user = await api.get<User>('/auth/me');
      set({ user, status: 'authenticated' });
    } catch {
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));
