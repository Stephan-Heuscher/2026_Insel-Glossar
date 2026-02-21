"use client";

import { create } from 'zustand';
import { auth, db } from '@/lib/firebase';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';

interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    needsVerification: boolean; // true when Google auth succeeded but no Firestore profile exists
    signInWithGoogle: () => Promise<void>;
    createProfile: (displayName: string, avatarId: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
    clearError: () => void;
    setError: (msg: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    loading: true,
    error: null,
    needsVerification: false,

    signInWithGoogle: async () => {
        try {
            set({ error: null });
            const provider = new GoogleAuthProvider();
            const cred = await signInWithPopup(auth, provider);

            // Check if user already has a profile (returning user)
            const profileDoc = await getDoc(doc(db, 'users', cred.user.uid));
            if (profileDoc.exists()) {
                // Returning user — profile loaded by onAuthStateChanged
                set({ needsVerification: false });
            } else {
                // New user — needs verification challenge
                set({ user: cred.user, needsVerification: true });
            }
        } catch (err: any) {
            console.error("Google sign-in error:", err);
            let msg = 'Ein unbekannter Fehler ist aufgetreten.';

            if (err.code === 'auth/popup-closed-by-user') {
                msg = 'Anmeldung abgebrochen.';
            } else if (err.code === 'auth/popup-blocked') {
                msg = 'Popup wurde blockiert. Bitte erlaube Popups für diese Seite.';
            } else if (err.message) {
                msg = err.message;
            }

            set({ error: msg });
        }
    },

    createProfile: async (displayName: string, avatarId: string) => {
        const { user } = get();
        if (!user) return;
        try {
            const profileData = {
                uid: user.uid,
                displayName,
                email: user.email || '',
                avatarId: avatarId || 'doctor',
                createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', user.uid), profileData);

            const profile: UserProfile = {
                ...profileData,
                createdAt: new Date(),
            } as unknown as UserProfile;
            set({ profile, needsVerification: false });
        } catch (err: any) {
            console.error("Create profile error:", err);
            set({ error: 'Profil konnte nicht erstellt werden.' });
        }
    },

    logout: async () => {
        await signOut(auth);
        set({ user: null, profile: null, needsVerification: false });
    },

    updateProfile: async (data: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) return;
        await setDoc(doc(db, 'users', user.uid), data, { merge: true });
        set(state => ({ profile: state.profile ? { ...state.profile, ...data } : null }));
    },

    clearError: () => set({ error: null }),
    setError: (msg: string) => set({ error: msg }),
}));

// Initialize auth listener
if (typeof window !== 'undefined') {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const profileDoc = await getDoc(doc(db, 'users', user.uid));
            if (profileDoc.exists()) {
                const profile = profileDoc.data() as UserProfile;
                useAuthStore.setState({ user, profile, loading: false, needsVerification: false });
            } else {
                // User authenticated but no profile — needs verification
                useAuthStore.setState({ user, profile: null, loading: false, needsVerification: true });
            }
        } else {
            useAuthStore.setState({ user: null, profile: null, loading: false, needsVerification: false });
        }
    });
}
