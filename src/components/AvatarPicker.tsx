"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { AVATAR_CATEGORIES } from '@/lib/avatars';

import { getAvatarBgColor } from './Avatar';

interface AvatarPickerProps {
  uid: string;
  currentAvatar?: string | null;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ uid, currentAvatar, onSelect, onClose }: AvatarPickerProps) {
  const [activeTab, setActiveTab] = useState<string>(Object.keys(AVATAR_CATEGORIES)[0]);

  const handleSelect = (url: string) => {
    onSelect(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex md:items-center items-end justify-center p-0 md:p-6 shadow-2xl">
      <div className="bg-background w-full md:w-auto md:min-w-[600px] max-w-4xl max-h-[90vh] md:rounded-3xl rounded-t-3xl flex flex-col pt-4 md:p-6 overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 px-6 md:px-0">
          <h2 className="text-2xl font-bold">Pick an Avatar</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 md:px-0 gap-2 overflow-x-auto pb-4 scrollbar-hide shrink-0">
          {Object.keys(AVATAR_CATEGORIES).map(category => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`px-4 py-2 font-bold rounded-xl whitespace-nowrap transition-colors ${
                activeTab === category 
                  ? 'bg-primary text-white' 
                  : 'bg-surface text-muted-foreground hover:bg-surface-hover'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-0 min-h-[300px]">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 pb-12 md:pb-0">
            {AVATAR_CATEGORIES[activeTab as keyof typeof AVATAR_CATEGORIES].map((url, i) => {
              const bgClass = getAvatarBgColor(url); // Use URL to make BG pseudo-random but stable
              return (
              <button
                key={i}
                onClick={() => handleSelect(url)}
                className={`group relative aspect-square rounded-2xl overflow-hidden ${bgClass} hover:scale-105 transition-transform flex items-center justify-center ${
                  currentAvatar === url ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''
                }`}
              >
                <img 
                  src={url} 
                  alt={`${activeTab} avatar ${i + 1}`} 
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" 
                />
              </button>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
}