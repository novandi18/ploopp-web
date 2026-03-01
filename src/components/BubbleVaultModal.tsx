"use client";

import { useState, useEffect } from 'react';
import { Drop, DropContent } from '@/types';
import { getDropContent, deleteDrop } from '@/services/dropRepository';
import { decryptData, hashPassword } from '@/lib/cryptoUtils';
import { X, Unlock, Lock, Trash2, ShieldAlert, CheckCircle2, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/services/authStore';

interface BubbleVaultModalProps {
  drop: Drop;
  onClose: () => void;
  onDeleted: () => void;
}

export default function BubbleVaultModal({ drop, onClose, onDeleted }: BubbleVaultModalProps) {
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.uid === drop.creator_id;

  const [loading, setLoading] = useState(true);
  const [vaultInfo, setVaultInfo] = useState<DropContent | null>(null);
  
  const [passwordInput, setPasswordInput] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');

  // Delete status
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadVault() {
      try {
        const content = await getDropContent(drop.drop_id);
        if (content) {
          setVaultInfo(content);
          
          // If no password is required, decrypt automatically with default key
          if (!drop.requires_password) {
            const dec = await decryptData(content.encrypted_data, "ploopp_default_public_vault_key");
            setDecryptedMessage(dec);
          }
        } else {
          setErrorText('Vault not found or has been burned.');
        }
      } catch (err) {
        setErrorText('Failed to load vault securely.');
      } finally {
        setLoading(false);
      }
    }
    loadVault();
  }, [drop]);

  const handleUnlock = async () => {
    if (!vaultInfo) return;
    setErrorText('');

    try {
      // 1. Hash the user input and compare it to the stored Hash (Zero Knowledge Proof of password)
      const inputHash = await hashPassword(passwordInput);
      if (inputHash !== vaultInfo.key_hash) {
        setErrorText("Incorrect Password! It won't budge.");
        return;
      }

      // 2. Actually Decrypt the data
      const message = await decryptData(vaultInfo.encrypted_data, passwordInput);
      setDecryptedMessage(message);
    } catch (err) {
      setErrorText("Decryption failed. The bubble remains solid.");
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this bubble?')) return;
    setIsDeleting(true);
    try {
      await deleteDrop(drop.drop_id);
      onDeleted();
      onClose();
    } catch (err) {
      setErrorText("Failed to delete bubble.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-[2.5rem] shadow-[0_20px_60px_rgb(56,189,248,0.15)] border-2 border-primary/20 p-6 sm:p-8 relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Background Bubbles for Modal */}
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-secondary/10 rounded-full blur-2xl"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-background rounded-full hover:bg-red-50 hover:text-red-500 transition-colors z-10"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <div className="text-center mb-6 mt-2 relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-4">
            {decryptedMessage ? <MessageCircle className="h-8 w-8" /> : drop.requires_password ? <Lock className="h-8 w-8" /> : <Unlock className="h-8 w-8" />}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{drop.title_hint}</h2>
          <p className="text-sm font-medium text-foreground/50 mt-1">
            Dropped gracefully by {drop.is_guest_post ? 'a Guest Ninja' : 'a Member'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            {errorText && (
              <div className="bg-red-500/10 text-red-600 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 border border-red-500/20">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                {errorText}
              </div>
            )}

            {!decryptedMessage ? (
              <div className="bg-background/80 p-5 rounded-3xl border border-foreground/5 space-y-4">
                <p className="text-sm font-bold text-center text-foreground/70">
                  This bubble is locked with a secret password!
                </p>
                <div className="space-y-3">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter Password..."
                    className="w-full px-5 py-3 bg-white/50 border-2 border-transparent focus:border-secondary text-foreground rounded-xl outline-none font-medium text-center"
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  />
                  <button 
                    onClick={handleUnlock}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-secondary hover:bg-secondary-hover text-white rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    <Unlock className="h-4 w-4" strokeWidth={2.5} />
                    POPP IT!
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/20 space-y-3 text-center animate-in slide-in-from-bottom-2">
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-bold text-sm text-primary uppercase tracking-widest">Secret Unlocked</p>
                <div className="bg-white p-4 rounded-xl border border-primary/10 shadow-inner">
                  <p className="text-lg font-medium text-foreground whitespace-pre-wrap word-break">
                    {decryptedMessage}
                  </p>
                </div>
              </div>
            )}

            {/* If the current user owns it, they can delete it */}
            {isOwner && (
              <div className="pt-4 border-t border-foreground/10 text-center">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 border border-red-100"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                  {isDeleting ? 'Blowing away...' : 'Delete My Bubble'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
