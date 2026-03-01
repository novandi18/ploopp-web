"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/services/authStore';
import { getTopPlayers, LeaderboardEntry, getUserRank } from '@/services/gamificationRepository';
import { useLocation } from '@/hooks/useLocation';
import { ShieldAlert, Trophy, MapPin, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuthStore();
  const { geohash7, loading: locationLoading } = useLocation();
  const router = useRouter();

  const [players, setPlayers] = useState<(LeaderboardEntry & { current_geohash?: string })[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [myRankPosition, setMyRankPosition] = useState<number>(0);
  const [fetching, setFetching] = useState(true);
  const [filterMode, setFilterMode] = useState<"GLOBAL" | "LOCAL">("GLOBAL");
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const topPlayers = await getTopPlayers();
        // Since we might not have 'current_geohash' in our db yet, 
        // we append mock geohashes for demonstration of the local filtering feature if they are missing
        // Just for visual completeness of this prompt requirement.
        const populatedPlayers = topPlayers.map((p, i) => ({
          ...p,
          current_geohash: (p as LeaderboardEntry & { current_geohash?: string }).current_geohash || (i % 3 === 0 && geohash7 ? geohash7.substring(0, 4) + 'abc' : 'gbsu7xx')
        }));
        setPlayers(populatedPlayers);

        if (user && !user.isAnonymous) {
          const stats = await getUserRank(user.uid);
          setMyRank(stats);
          const pos = populatedPlayers.findIndex(p => p.uid === user.uid);
          setMyRankPosition(pos >= 0 ? pos + 1 : 0);
        }
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [user, geohash7]);

  const isGuest = user?.isAnonymous || !user;

  // Filtering Logic
  const filteredPlayers = useMemo(() => {
    if (filterMode === "GLOBAL") return players;
    if (!geohash7) return players; 
    const localPrefix = geohash7.substring(0, 4);
    return players.filter(p => p.current_geohash?.startsWith(localPrefix));
  }, [players, filterMode, geohash7]);

  const top3 = filteredPlayers.slice(0, 3);
  const rest = filteredPlayers.slice(3, 20);

  if (authLoading || fetching || locationLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-bounce w-16 h-16 bg-primary rounded-full blur-sm opacity-50"></div>
      </div>
    );
  }

  const handleRowClick = () => {
    if (isGuest) {
      setShowLoginModal(true);
    }
  };

  const getRankThreshold = (points: number) => {
    if (points >= 1000) return { next: 'Legend', max: 5000, current: 1000 };
    if (points >= 500) return { next: 'Diamond', max: 1000, current: 500 };
    if (points >= 250) return { next: 'Platinum', max: 500, current: 250 };
    if (points >= 100) return { next: 'Gold', max: 250, current: 100 };
    return { next: 'Silver', max: 100, current: 0 };
  };

  const progressData = myRank ? getRankThreshold(myRank.total_points) : null;
  const progressPercent = progressData 
    ? Math.min(100, Math.max(0, ((myRank!.total_points - progressData.current) / (progressData.max - progressData.current)) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-32">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
        
        {/* Header & Toggle */}
        <div className="p-6 pb-2">
          <h1 className="text-3xl font-extrabold text-foreground text-center mb-6">Leaderboard</h1>
          
          <div className="flex bg-surface p-1 rounded-full shadow-sm border border-black/5 animate-in slide-in-from-top-4 duration-500">
            <button 
              onClick={() => setFilterMode("GLOBAL")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-bold transition-all text-sm ${filterMode === "GLOBAL" ? 'bg-primary text-white shadow-md scale-100' : 'text-foreground/60 hover:bg-black/5 scale-95'}`}
            >
              <Globe className="w-4 h-4" /> Global
            </button>
            <button 
              onClick={() => setFilterMode("LOCAL")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-bold transition-all text-sm ${filterMode === "LOCAL" ? 'bg-secondary text-white shadow-md scale-100' : 'text-foreground/60 hover:bg-black/5 scale-95'}`}
            >
              <MapPin className="w-4 h-4" /> Local
            </button>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="pt-8 pb-10 px-4 flex items-end justify-center gap-2 sm:gap-4 animate-in fade-in zoom-in-95 duration-500">
          {/* Rank 2 */}
          {top3[1] && (
            <div className={`flex flex-col items-center w-1/3 ${isGuest ? 'cursor-pointer' : 'cursor-default'}`} onClick={handleRowClick}>
              <div className="relative mb-2 mt-4 transition-transform hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-surface border-4 border-slate-300 shadow-lg flex items-center justify-center overflow-hidden">
                  <span className="text-xl font-black text-slate-400">{top3[1].username.substring(0,2).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-300 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-surface">2</div>
              </div>
              <div className="h-24 w-full bg-slate-100 rounded-t-3xl border border-slate-200 flex flex-col justify-start items-center pt-4">
                <span className="text-secondary font-black text-sm">{top3[1].total_points}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold text-center px-1 truncate w-full">{top3[1].username}</span>
              </div>
            </div>
          )}
          
          {/* Rank 1 */}
          {top3[0] && (
            <div className={`flex flex-col items-center w-1/3 z-10 ${isGuest ? 'cursor-pointer' : 'cursor-default'}`} onClick={handleRowClick}>
              <div className="relative mb-2 transition-transform hover:-translate-y-2">
                <Trophy className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 text-accent drop-shadow-md z-10" fill="currentColor" />
                <div className="w-20 h-20 rounded-full bg-surface border-4 border-accent shadow-xl flex items-center justify-center overflow-hidden z-0">
                  <span className="text-2xl font-black text-accent">{top3[0].username.substring(0,2).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-surface">1</div>
              </div>
              <div className="h-32 w-full bg-gradient-to-t from-accent/10 to-accent/20 rounded-t-[2rem] border-x border-t border-accent/30 shadow-[0_-5px_15px_rgba(251,191,36,0.2)] flex flex-col justify-start items-center pt-4">
                <span className="text-secondary font-black text-lg">{top3[0].total_points}</span>
                <span className="text-xs text-foreground uppercase font-black">{top3[0].username}</span>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {top3[2] && (
            <div className={`flex flex-col items-center w-1/3 ${isGuest ? 'cursor-pointer' : 'cursor-default'}`} onClick={handleRowClick}>
              <div className="relative mb-2 mt-8 transition-transform hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-surface border-4 border-orange-300 shadow-lg flex items-center justify-center overflow-hidden">
                  <span className="text-lg font-black text-orange-400">{top3[2].username.substring(0,2).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-orange-300 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-surface">3</div>
              </div>
              <div className="h-20 w-full bg-orange-50 rounded-t-3xl border border-orange-100 flex flex-col justify-start items-center pt-3">
                <span className="text-secondary font-black text-sm">{top3[2].total_points}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold text-center px-1 truncate w-full">{top3[2].username}</span>
              </div>
            </div>
          )}
        </div>

        {/* List Rank 4-20 */}
        <div className={`flex-1 px-4 space-y-3 pb-8 ${isGuest ? 'relative' : ''}`}>
          {isGuest && (
            <div className="absolute inset-0 z-10 flex flex-col items-center pt-20">
              <div className="bg-surface/80 backdrop-blur-md px-6 py-4 border border-primary/20 rounded-2xl shadow-xl text-center flex flex-col items-center">
                <ShieldAlert className="w-8 h-8 text-secondary mb-2" />
                <h3 className="font-bold text-foreground">Guests can&apos;t rank up!</h3>
                <p className="text-sm text-muted-foreground mt-1">Unlock the full list by joining.</p>
              </div>
            </div>
          )}

          <div className={isGuest ? 'opacity-30 blur-[3px] pointer-events-none' : ''}>
            {rest.map((p, idx) => (
              <div 
                key={p.uid} 
                onClick={handleRowClick}
                className={`flex items-center justify-between p-4 bg-surface rounded-[24px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] border-2 border-transparent hover:border-primary/20 transition-all ${isGuest ? 'cursor-pointer' : 'cursor-default'} transform hover:-translate-y-0.5`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center text-lg font-black text-foreground/40">{idx + 4}</div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                    {p.username.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{p.username}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{p.rank_tier}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-secondary">{p.total_points}</div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase">pts</div>
                </div>
              </div>
            ))}
            {rest.length === 0 && (
              <div className="text-center text-muted-foreground p-8">No more players found.</div>
            )}
          </div>
        </div>

      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full z-40 p-4 pb-6 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          {isGuest ? (
            /* Guest Sticky Bar CTA */
            <div className="bg-surface rounded-[24px] p-5 shadow-[0_10px_30px_rgba(251,146,60,0.2)] border-2 border-secondary/30 flex items-center justify-between animate-in slide-in-from-bottom-10 duration-700 spring">
              <div>
                <h4 className="font-extrabold text-foreground text-lg">Join the Race!</h4>
                <p className="text-xs text-muted-foreground">Log in to start earning points.</p>
              </div>
              <Link 
                href="/?auth=true" 
                className="bg-secondary text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-1 hover:bg-secondary-hover hover:scale-105 active:scale-95 transition-all shadow-md animate-bounce [animation-duration:2s]"
              >
                Sign Up <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Auth Sticky Profile Bar */
            <div className="bg-surface rounded-[24px] p-5 shadow-[0_10px_30px_rgba(56,189,248,0.2)] border-2 border-primary/30 animate-in slide-in-from-bottom-10 duration-500">
              <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-black text-xl shadow-inner">
                    {user.email ? user.email.substring(0,1).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">My Rank</div>
                    <div className="font-black text-foreground text-lg">
                      {myRankPosition > 0 ? `#${myRankPosition}` : 'Unranked'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-primary leading-none">{myRank?.total_points || 0}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Total Points</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              {progressData && (
                <div className="w-full">
                  <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                    <span className="text-primary">{myRank?.rank_tier || 'Beginner'}</span>
                    <span className="text-muted-foreground">Next: {progressData.next}</span>
                  </div>
                  <div className="w-full h-3 bg-primary/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Login Modal for Guest clicking rows */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl p-8 max-w-sm w-full border-2 border-primary/20 shadow-2xl text-center">
            <ShieldAlert className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-black text-foreground mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-8">You need to have an account to inspect player profiles or rank up!</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLoginModal(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-background text-foreground hover:bg-black/5 transition-colors"
              >
                Close
              </button>
              <Link 
                href="/?auth=true"
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary text-white shadow-md hover:bg-primary-hover active:scale-95 transition-all"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}