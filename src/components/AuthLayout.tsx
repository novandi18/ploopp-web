"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/services/authStore';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const initializeAuthListener = useAuthStore((state) => state.initializeAuthListener);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-primary text-accent">
        <div className="animate-pulse">Decrypting Identity...</div>
      </div>
    );
  }

  return <>{children}</>;
}
