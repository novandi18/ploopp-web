"use client";

import { Sparkles, MapPin, Lock, Unlock, EyeOff, Navigation, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-surface p-8 sm:p-12 rounded-[2.5rem] shadow-[0_10px_40px_rgb(56,189,248,0.1)] border border-primary/5">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-3">
              <Sparkles className="text-accent h-10 w-10 animate-pulse" />
              How to Ploopp!
            </h1>
            <p className="text-foreground/60 font-medium mt-4 text-lg max-w-xl mx-auto">
              Your quick guide to dropping and finding secret bubbles around the world.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            
            {/* Rule 1 */}
            <div className="bg-background/50 p-6 rounded-3xl border border-foreground/5 relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="h-12 w-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Find a Location</h3>
              <p className="text-foreground/70 font-medium leading-relaxed">
                Your map automatically centers on your current physical location. Want to drop a bubble somewhere else? Just click anywhere on the radar to set a custom drop point!
              </p>
            </div>

            {/* Rule 2 */}
            <div className="bg-background/50 p-6 rounded-3xl border border-foreground/5 relative overflow-hidden group hover:border-secondary/30 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="h-12 w-12 bg-secondary/20 text-secondary rounded-2xl flex items-center justify-center mb-4">
                <Lock className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Write & Encrypt</h3>
              <p className="text-foreground/70 font-medium leading-relaxed">
                Type your secret message. You can optionally set a password. Thanks to our Zero-Knowledge Architecture, not even our servers can read your message!
              </p>
            </div>

            {/* Rule 3 */}
            <div className="bg-background/50 p-6 rounded-3xl border border-foreground/5 relative overflow-hidden group hover:border-accent/30 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="h-12 w-12 bg-accent/20 text-accent rounded-2xl flex items-center justify-center mb-4">
                <Navigation className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Hunting 1 Kilometer</h3>
              <p className="text-foreground/70 font-medium leading-relaxed">
                You can only see and unlock bubbles that are within a <b>1 KM radius</b> of your current physical location relative to where the drop actually is. Get moving!
              </p>
            </div>

            {/* Rule 4 */}
            <div className="bg-background/50 p-6 rounded-3xl border border-foreground/5 relative overflow-hidden group hover:border-green-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="h-12 w-12 bg-green-500/20 text-green-500 rounded-2xl flex items-center justify-center mb-4">
                <EyeOff className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold mb-2">4. Delete & Disappear</h3>
              <p className="text-foreground/70 font-medium leading-relaxed">
                Bubbles automatically evaporate (expire) after 24 hours. You can also manually permanently delete any bubble you created directly from its popup.
              </p>
            </div>

          </div>

          <div className="mt-12 bg-surface border-2 border-primary/20 rounded-3xl p-6 text-center">
            <h3 className="text-xl font-bold mb-4 flex justify-center items-center gap-2">
              <CheckCircle2 className="text-primary h-6 w-6" /> Legend Guide
            </h3>
            <div className="flex flex-col sm:flex-row justify-center gap-6 font-medium text-foreground/80">
              <div className="flex items-center gap-3 bg-background px-4 py-2 rounded-xl">
                <div className="h-4 w-4 bg-[#FACC15] rounded-full ring-2 ring-white shadow-sm"></div>
                Yellow Pin = Placed by a Guest
              </div>
              <div className="flex items-center gap-3 bg-background px-4 py-2 rounded-xl">
                <div className="h-4 w-4 bg-[#38BDF8] rounded-full ring-2 ring-white shadow-sm"></div>
                Blue Pin = Placed by a Member
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 px-8 py-4 rounded-full font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/30 transition-transform duration-300 ease-out hover:scale-110 active:scale-95 cursor-pointer"
            >
              <span>Back to Radar</span>
              <Navigation className="h-5 w-5 ml-2" strokeWidth={2.5} />
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
