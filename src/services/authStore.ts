import { create } from 'zustand';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  initializeAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  initializeAuthListener: () => {
    // Ensures we only listen to auth changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      set({ user: currentUser, loading: false });
    });
    return unsubscribe;
  },
}));
