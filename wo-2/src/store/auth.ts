import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Profile {
    id: string;
    role: string;
    full_name?: string;
    avatar_url?: string;
}

interface AuthState {
    user: any | null;
    profile: Profile | null;
    isLoading: boolean;
    isInitialized: boolean;
    setUser: (user: any | null) => void;
    setProfile: (profile: Profile | null) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    isLoading: true,
    isInitialized: false,
    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
    },
}));
