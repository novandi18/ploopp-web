"use client";

import { useAuthStore } from '@/services/authStore';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Droplet, LogOut, User as UserIcon, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="w-full bg-surface shadow-[0_4px_20px_rgb(0,0,0,0.05)] p-4 flex justify-between items-center sticky top-0 z-50">
      <Link href="/" className="flex items-center space-x-2 text-primary cursor-pointer hover:scale-105 transition-transform duration-300 ease-out">
        <Droplet className="h-8 w-8" strokeWidth={2.5} />
        <span className="font-extrabold text-2xl tracking-tight">Ploopp</span>
      </Link>
      
      {user && (
        <div className="flex items-center space-x-3 sm:space-x-6">
          <Link
            href="/guide"
            className="flex items-center justify-center p-2 sm:px-4 sm:py-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-full font-bold transition-all duration-300 ease-out hover:scale-105 cursor-pointer"
            title="How to use Ploopp"
          >
            <BookOpen className="h-5 w-5 sm:mr-2" strokeWidth={2.5} />
            <span className="hidden sm:inline">Guide</span>
          </Link>
          
          <div className="flex items-center space-x-2 text-sm font-medium text-foreground/70 bg-background px-4 py-2 rounded-full hidden sm:flex border border-foreground/5 shadow-sm">
            <UserIcon className="h-5 w-5 text-secondary" strokeWidth={2.5} />
            <span>{user.isAnonymous ? 'Guest' : user.email?.split('@')[0]}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center h-10 w-10 sm:w-auto sm:px-5 space-x-2 rounded-full font-bold shadow-sm border border-foreground/10 text-foreground hover:text-white bg-surface hover:bg-secondary hover:shadow-lg transition-all duration-300 ease-out hover:scale-105 group cursor-pointer"
            aria-label="Log Out"
          >
            <LogOut className="h-5 w-5 sm:group-hover:mr-1 transition-all" strokeWidth={2.5} />
            <span className="hidden sm:inline">Pop Out</span>
          </button>
        </div>
      )}
    </nav>
  );
}
