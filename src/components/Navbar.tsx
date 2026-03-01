"use client";

import { useAuthStore } from '@/services/authStore';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Droplet, LogOut, User as UserIcon, BookOpen, Trophy, Compass } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getLinkClasses = (path: string) => {
    // Exact match for 'Explore' page which is just "/", otherwise match prefix
    const isActive = path === '/' ? pathname === '/' : pathname?.startsWith(path);
    const base = "flex items-center justify-center p-2 sm:px-4 sm:py-2 rounded-full font-bold transition-all duration-300 ease-out hover:scale-105 cursor-pointer";
    return isActive 
      ? `${base} bg-primary text-white shadow-md` 
      : `${base} text-primary bg-primary/10 hover:bg-primary/20`;
  };

  const getProfileClasses = () => {
    const isActive = pathname === '/profile';
    const base = "flex items-center space-x-2 text-sm font-medium p-2 sm:px-4 sm:py-2 rounded-full border shadow-sm transition-colors cursor-pointer group";
    return isActive
      ? `${base} border-primary bg-primary/10 text-primary`
      : `${base} border-foreground/5 bg-background text-foreground/70 hover:bg-primary/5`;
  };

  return (
    <nav className="w-full bg-surface shadow-[0_4px_20px_rgb(0,0,0,0.05)] p-3 sm:p-4 flex flex-wrap justify-between items-center sticky top-0 z-50 gap-y-2">
      <Link href="/" className="flex items-center space-x-2 text-primary cursor-pointer hover:scale-105 transition-transform duration-300 ease-out">
        <Droplet className="h-8 w-8" strokeWidth={2.5} />
        <span className="font-extrabold text-2xl tracking-tight hidden sm:inline">Ploopp</span>
      </Link>
      
      {user && (
        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
          <Link
            href="/"
            className={getLinkClasses('/')}
            title="Explore"
          >
            <Compass className="h-5 w-5 sm:mr-2" strokeWidth={2.5} />
            <span className="hidden lg:inline">Explore</span>
          </Link>

          <Link
            href="/leaderboard"
            className={getLinkClasses('/leaderboard')}
            title="Leaderboard"
          >
            <Trophy className="h-5 w-5 sm:mr-2" strokeWidth={2.5} />
            <span className="hidden lg:inline">Rank</span>
          </Link>
          
          <Link
            href="/guide"
            className={getLinkClasses('/guide')}
            title="Overview"
          >
            <BookOpen className="h-5 w-5 sm:mr-2" strokeWidth={2.5} />
            <span className="hidden lg:inline">Guide</span>
          </Link>
          
          <Link href="/profile" className={getProfileClasses()} title="Profile">
            <UserIcon className="h-5 w-5 text-secondary" strokeWidth={2.5} />
            <span className="hidden sm:inline">{user.isAnonymous ? 'Guest' : user.email?.split('@')[0]}</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center h-10 w-10 sm:w-auto sm:px-5 space-x-2 rounded-full font-bold shadow-sm border border-foreground/10 text-foreground hover:text-white bg-surface hover:bg-secondary hover:shadow-lg transition-all duration-300 ease-out hover:scale-105 group cursor-pointer"
            aria-label="Log Out"
          >
            <LogOut className="h-5 w-5 sm:group-hover:mr-1 transition-all" strokeWidth={2.5} />
            <span className="hidden lg:inline">Pop Out</span>
          </button>
        </div>
      )}
    </nav>
  );
}
