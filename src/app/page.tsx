"use client";

import { useAuthStore } from '@/services/authStore';
import { useLocation } from '@/hooks/useLocation';
import { MapPin, Smile, AlertCircle, Send, Sparkles, Navigation, CheckCircle2, Ghost } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MapRadar from '@/components/MapRadar';
import BubbleVaultModal from '@/components/BubbleVaultModal';
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Coordinates, Drop } from '@/types';
import { createDrop, getNearbyDrops } from '@/services/dropRepository';
import { encryptData, hashPassword } from '@/lib/cryptoUtils';
import geohash from 'ngeohash';

// Haversine formula to calculate the exact distance between two coordinates in Kilometers
function calculateDistanceInKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180); 
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isHovering, setIsHovering] = useState(false);

  // Map and Drop state
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [nearbyDrops, setNearbyDrops] = useState<Drop[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState('');
  
  // Custom secret inputs
  const [secretMessage, setSecretMessage] = useState('');
  const [dropPassword, setDropPassword] = useState('');
  
  // Vault Modal State
  const [activeDrop, setActiveDrop] = useState<Drop | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchDrops() {
      if (!location.coords) return;
      // Precision 5 is roughly a 4.9km x 4.9km grid cell.
      // By taking this cell and its 8 surroundings, it ensures we comfortably cover at least a 1 KM radius circle everywhere.
      const myHash = geohash.encode(location.coords.latitude, location.coords.longitude, 5);
      const neighbors = geohash.neighbors(myHash);
      const allHashes = [myHash, ...neighbors];
      
      try {
        const drops = await getNearbyDrops(allHashes, user?.uid || null, !!user?.isAnonymous);
        
        // Filter precisely for bubbles that are strictly within 1 KM
        const RADIUS_KM = 1;
        const validDropsWithinRadius = drops.filter(drop => {
          const distance = calculateDistanceInKM(
            location.coords!.latitude, 
            location.coords!.longitude, 
            drop.latitude, 
            drop.longitude
          );
          return distance <= RADIUS_KM;
        });

        if (isMounted) setNearbyDrops(validDropsWithinRadius);
      } catch (error) {
        console.error("Failed to fetch drops", error);
      }
    }

    if (user && location.coords) {
      fetchDrops();
      // Poll every 10 seconds to find new bubbles
      const interval = setInterval(fetchDrops, 10000);
      return () => { isMounted = false; clearInterval(interval); };
    }
  }, [location.coords, user]);

  const handleDropBubble = async () => {
    if (!user) return;
    if (!secretMessage) {
      setGenerateMsg('Please write a secret message first!');
      setTimeout(() => setGenerateMsg(''), 3000);
      return;
    }

    const dropCoords = selectedLocation || location.coords;
    if (!dropCoords) {
      setGenerateMsg('Waiting for location signal...');
      return;
    }

    setIsGenerating(true);
    setGenerateMsg('Encrypting secret bubble...');
    
    try {
      // If password is empty, encrypt with a robust default zero-knowledge key
      // and mark the metadata so the client knows it can just automatically decrypt it later.
      const encryptionPassword = dropPassword || "ploopp_default_public_vault_key";
      
      const vaultData = await encryptData(secretMessage, encryptionPassword);
      const kHash = dropPassword ? await hashPassword(dropPassword) : "NO_HASH";
      
      const now = Date.now();
      const expires = now + 1000 * 60 * 60 * 24; // 24 hours

      const dropMetadata = {
        creator_id: user.uid,
        visibility_type: "PUBLIC" as const,
        allowed_users: [],
        geohash: geohash.encode(dropCoords.latitude, dropCoords.longitude, 5), // Save using bounds size 5 to match search
        latitude: dropCoords.latitude,
        longitude: dropCoords.longitude,
        title_hint: dropPassword ? "A secret bubble nearby!" : "An open whisper...",
        is_guest_post: user.isAnonymous,
        expires_at: expires,
        created_at: now,
        requires_password: dropPassword.length > 0,
      };

      const vault = {
        encrypted_data: vaultData,
        key_hash: kHash,
        burn_after_reading: false,
        content_type: "text" as const,
      };

      await createDrop(dropMetadata, vault);
      import('@/services/gamificationRepository').then(({ handleDropCreated }) => {
        handleDropCreated(user.uid, user.isAnonymous);
      }).catch(err => console.error(err));
      setGenerateMsg('Bubble dropped successfully!');
      
      // Reset fields upon success
      setSecretMessage('');
      setDropPassword('');
      setSelectedLocation(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setGenerateMsg('Failed to drop: ' + error.message);
      }
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerateMsg('');
      }, 3000);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorText(error.message);
      } else {
        setErrorText('An unknown error occurred');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorText(error.message);
      } else {
        setErrorText('An unknown error occurred');
      }
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorText(error.message);
      } else {
        setErrorText('An unknown error occurred');
      }
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="bg-surface p-8 rounded-[2rem] space-y-6 shadow-[0_10px_40px_rgb(56,189,248,0.1)] border border-primary/5 transition-all">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                  Map Radar
                </h1>
                <p className="text-foreground/50 font-medium">Click on the map to set a custom drop location!</p>
              </div>
              <div className="relative">
                {/* Pulsing Ripple Effect */}
                <div className={`absolute inset-0 rounded-full bg-primary/30 ${!location.error ? 'animate-ripple' : ''}`}></div>
                <div className={`relative p-4 rounded-full ${location.error ? 'bg-red-100 text-red-500' : 'bg-primary text-white shadow-lg shadow-primary/40'}`}>
                  {location.loading ? <Navigation className="h-8 w-8 animate-spin" strokeWidth={2.5}/> : <MapPin className="h-8 w-8" strokeWidth={2.5} />}
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3 text-lg font-bold">
                {location.loading ? (
                  <span className="text-primary animate-pulse">Blowing GPS bubbles...</span>
                ) : location.error ? (
                  <span className="text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-6 w-6" strokeWidth={2.5} />
                    Signal lost ({location.error})
                  </span>
                ) : (
                  <span className="text-success flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
                    Ready to pop!
                  </span>
                )}
              </div>
              
              <div className="mt-2 mb-4">
                <MapRadar 
                  userLocation={location.coords} 
                  selectedLocation={selectedLocation}
                  onLocationSelect={setSelectedLocation}
                  drops={nearbyDrops}
                  onDropClick={setActiveDrop}
                />
              </div>
              
              {location.coords && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-medium mt-4">
                  <div className="bg-background pt-4 pb-3 px-4 rounded-2xl border border-foreground/5 hover:scale-[1.02] transition-transform duration-300">
                    <div className="text-primary font-bold text-xs uppercase tracking-wider mb-1">YOUR LAT</div>
                    <div className="text-xl text-foreground/80">{location.coords.latitude.toFixed(5)}</div>
                  </div>
                  <div className="bg-background pt-4 pb-3 px-4 rounded-2xl border border-foreground/5 hover:scale-[1.02] transition-transform duration-300">
                    <div className="text-primary font-bold text-xs uppercase tracking-wider mb-1">YOUR LNG</div>
                    <div className="text-xl text-foreground/80">{location.coords.longitude.toFixed(5)}</div>
                  </div>
                  <div className="col-span-2 bg-gradient-to-r from-primary/10 to-secondary/10 pt-4 pb-3 px-4 rounded-2xl border border-foreground/5 relative flex flex-col justify-center text-center">
                    <div className="text-secondary font-bold text-xs uppercase tracking-wider mb-1">TARGET GEOHASH</div>
                    <span className="text-2xl font-bold text-foreground/80 tracking-[0.3em] font-mono">
                      {selectedLocation ? geohash.encode(selectedLocation.latitude, selectedLocation.longitude, 7) : location.geohash7}
                    </span>
                    {selectedLocation && (
                      <button 
                        onClick={() => setSelectedLocation(null)}
                        className="absolute right-3 top-3 bottom-3 px-3 bg-red-100/50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center transition-colors text-xs font-bold"
                        title="Cancel custom location"
                      >
                        Reset Target
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-foreground/10 mt-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles className="text-accent h-5 w-5" strokeWidth={2.5} />
                  Secret Engine Active!
                </h2>
                <p className="text-sm font-medium text-foreground/50 mt-1">
                  {generateMsg || 'End-to-End Encryption ready. Write a secret, pick a spot, and drop!'}
                </p>
              </div>

              <div className="bg-background/50 rounded-2xl p-4 border border-foreground/5 space-y-4">
                <input
                  type="password"
                  value={dropPassword}
                  onChange={(e) => setDropPassword(e.target.value)}
                  placeholder="Lock with Password (Optional)"
                  className="w-full px-5 py-3 bg-background border-2 border-transparent focus:border-secondary text-foreground placeholder-foreground/40 rounded-xl outline-none transition-all duration-300 font-medium"
                />
                <textarea
                  value={secretMessage}
                  onChange={(e) => setSecretMessage(e.target.value)}
                  placeholder="Whisper your secret message here..."
                  className="w-full px-5 py-3 h-24 resize-none bg-background border-2 border-transparent focus:border-primary text-foreground placeholder-foreground/40 rounded-xl outline-none transition-all duration-300 font-medium"
                ></textarea>
                
                <div className="flex justify-end">
                  <button 
                    onClick={handleDropBubble}
                    disabled={isGenerating || !location.coords}
                    className={`flex items-center space-x-2 px-8 py-3 rounded-full font-bold text-white shadow-lg transition-transform duration-300 ease-out cursor-pointer ${isGenerating ? 'bg-primary/50 scale-95' : 'bg-primary hover:bg-primary-hover shadow-primary/30 hover:scale-[1.02] active:scale-95'}`}
                  >
                    {isGenerating ? (
                      <Navigation className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                    ) : (
                      <Send className="h-5 w-5" strokeWidth={2.5} />
                    )}
                    <span>{isGenerating ? 'Encrypting...' : 'Drop a Bubble!'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Render the Vault Modal if a drop is selected */}
        {activeDrop && (
          <BubbleVaultModal 
            drop={activeDrop} 
            onClose={() => setActiveDrop(null)} 
            onDeleted={() => {
              setActiveDrop(null);
              // Optimistically filter it out
              setNearbyDrops(prev => prev.filter(d => d.drop_id !== activeDrop.drop_id));
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Playful Floating Bubbles (Decorative) */}
      <div className="absolute top-10 flex space-x-6 w-full max-w-screen-xl opacity-40 pointer-events-none px-10">
        <div className="h-32 w-32 bg-primary rounded-full blur-3xl ml-10 animate-[bounce_5s_infinite]"></div>
        <div className="h-40 w-40 bg-secondary rounded-full blur-3xl ml-auto animate-[bounce_7s_infinite_reverse]"></div>
        <div className="h-20 w-20 bg-accent rounded-full blur-2xl mt-40 animate-[bounce_6s_infinite]"></div>
      </div>

      <div className="w-full max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgb(56,189,248,0.15)] relative z-10 border border-white/50 backdrop-blur-sm">
        
        <div className="text-center space-y-4">
          <div className="flex justify-center -mt-16">
            <div 
              className={`p-5 bg-surface rounded-full shadow-xl transition-all duration-500 border-4 border-background ${isHovering ? 'scale-110 rotate-12 bg-primary text-white shadow-primary/40 text-white' : 'text-primary shadow-[0_10px_30px_rgb(56,189,248,0.2)]'}`}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <Smile className="h-10 w-10 transition-colors" strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
            Ploopp!
          </h2>
          <p className="text-foreground/60 font-medium text-lg max-w-[280px] mx-auto leading-tight">
            Drop a secret. Pop a surprise. Find what your friends left nearby!
          </p>
        </div>

        {errorText && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start space-x-3 text-red-600 text-sm font-semibold animate-in fade-in zoom-in duration-300">
            <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={2.5} />
            <span>{errorText}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleEmailLogin}>
          <div className="space-y-4">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-background border-2 border-transparent focus:border-primary text-foreground placeholder-foreground/40 rounded-2xl outline-none transition-all duration-300 font-medium hover:bg-background/80 focus:bg-surface focus:shadow-[0_4px_20px_rgb(56,189,248,0.1)]"
                placeholder="What's your email?"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-background border-2 border-transparent focus:border-secondary text-foreground placeholder-foreground/40 rounded-2xl outline-none transition-all duration-300 font-medium hover:bg-background/80 focus:bg-surface focus:shadow-[0_4px_20px_rgb(251,146,60,0.1)]"
                placeholder="Secret Password"
              />
            </div>
          </div>

          <div className="space-y-5 pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full text-white bg-primary hover:bg-primary-hover shadow-[0_8px_20px_rgb(56,189,248,0.3)] hover:shadow-[0_12px_25px_rgb(56,189,248,0.4)] focus:outline-none focus:ring-4 focus:ring-primary/30 font-bold text-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer"
            >
              Let&apos;s Pop In!
            </button>
            
            <div className="flex items-center justify-center space-x-4 opacity-50 px-4">
              <div className="h-px bg-foreground/30 flex-1 rounded-full"></div>
              <span className="font-semibold text-sm">OR</span>
              <div className="h-px bg-foreground/30 flex-1 rounded-full"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex justify-center items-center py-4 px-4 border-2 border-foreground/10 rounded-[1.5rem] text-foreground bg-surface hover:bg-background hover:border-accent focus:outline-none font-bold text-lg transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95 group cursor-pointer"
            >
              <span className="font-extrabold text-xl mr-2 pb-1 group-hover:text-accent transition-colors">G</span>
              <span>Pop in with Google</span>
            </button>
            <button
              type="button"
              onClick={handleAnonymousLogin}
              className="w-full flex justify-center items-center py-4 px-4 border-2 border-dashed border-foreground/20 rounded-[1.5rem] text-foreground/70 bg-transparent hover:bg-foreground/5 hover:border-foreground/30 focus:outline-none font-bold text-lg transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95 group cursor-pointer"
            >
              <Ghost className="h-5 w-5 mr-3 group-hover:animate-bounce" strokeWidth={2.5} />
              <span>Explore as Guest</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
