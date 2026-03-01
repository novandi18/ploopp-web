"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/services/authStore';
import { getUserRank, LeaderboardEntry, updateUsername } from '@/services/gamificationRepository';
import Link from 'next/link';
import { Edit2, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuthStore();
  const [rank, setRank] = useState<LeaderboardEntry | null>(null);
  const [fetching, setFetching] = useState(true);

  // Username Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    async function load() {
      if (user && !user.isAnonymous) {
        try {
          const stats = await getUserRank(user.uid);
          setRank(stats);
          if (stats?.username) setNewUsername(stats.username);
        } catch (err) {
          console.error(err);
        }
      }
      setFetching(false);
    }
    load();
  }, [user]);

  const handleSaveName = async () => {
    if (!user || user.isAnonymous || !newUsername.trim()) return;
    setSavingName(true);
    try {
      await updateUsername(user.uid, newUsername.trim());
      setRank(prev => prev ? { ...prev, username: newUsername.trim() } : prev);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  if (loading || fetching) return <div className="p-8 text-center">Loading...</div>;

  const isGuest = user?.isAnonymous || !user;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto mt-16">
        <h1 className="text-3xl font-bold text-foreground mb-8">Your Profile</h1>

        {isGuest ? (
          <div className="bg-surface p-8 rounded-2xl border-2 border-secondary/30 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Guest Explorer</h2>
            <p className="text-muted-foreground mb-6">
              You&apos;ve been finding Ploopps! Sign up now to start earning points and climb the leaderboard.
            </p>
            <Link href="/?auth=true" className="w-full sm:w-auto inline-block px-8 py-3 bg-secondary text-primary-foreground font-bold rounded-xl hover:bg-secondary/90 transition-transform active:scale-95">
              Create an Account
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Username Section */}
            <div className="bg-surface p-6 rounded-2xl border border-primary/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-1">Explorer Name</p>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)} 
                    className="text-2xl font-black text-foreground border-b-2 border-primary focus:outline-none bg-transparent"
                    placeholder="Enter your name"
                    autoFocus
                  />
                ) : (
                  <div className="text-3xl font-black text-foreground">{rank?.username || 'Unknown Explorer'}</div>
                )}
              </div>
              <div>
                {isEditing ? (
                  <button 
                    onClick={handleSaveName}
                    disabled={savingName || !newUsername.trim()}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary-hover disabled:opacity-50"
                  >
                    {savingName ? 'Saving...' : <><CheckCircle2 className="w-5 h-5" /> Save</>}
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Name
                  </button>
                )}
              </div>
            </div>

            <div className="bg-surface p-6 rounded-2xl border border-primary/20 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Total Points</p>
                <div className="text-4xl font-black text-primary mt-1">{rank?.total_points || 0}</div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Rank Tier</p>
                <div className="text-2xl font-bold text-secondary mt-1">{rank?.rank_tier || 'Beginner'}</div>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-2xl border border-primary/20 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">Badges</h3>
              {(!rank?.total_points || rank.total_points < 100) ? (
                <div className="text-muted-foreground text-sm">Earn 100 points to unlock your first badge!</div>
              ) : (
                <div className="flex gap-4">
                  {rank.total_points >= 100 && <div className="w-16 h-16 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-2xl" title="Silver">🥈</div>}
                  {rank.total_points >= 250 && <div className="w-16 h-16 rounded-full bg-yellow-100 border-4 border-yellow-400 flex items-center justify-center text-2xl" title="Gold">🥇</div>}
                  {rank.total_points >= 500 && <div className="w-16 h-16 rounded-full bg-cyan-100 border-4 border-cyan-400 flex items-center justify-center text-2xl" title="Platinum">💍</div>}
                  {rank.total_points >= 1000 && <div className="w-16 h-16 rounded-full bg-indigo-100 border-4 border-indigo-400 flex items-center justify-center text-2xl" title="Diamond">💎</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
