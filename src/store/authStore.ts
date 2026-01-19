import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';

interface AuthState {
  user: any;
  isAuthLoading: boolean;
  
  checkUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthLoading: true,

  checkUser: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      set({ user: data.session?.user || null });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user || null });
      });
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      set({ isAuthLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
    window.location.reload(); // รีโหลดเพื่อเคลียร์ Game Sta
  },
}));