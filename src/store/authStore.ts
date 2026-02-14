"use client";

import { create } from 'zustand';
import { auth, db } from '@/lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
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
    signUp: (email: string, password: string, displayName: string, avatarId?: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    loading: true,
    error: null,

    signUp: async (email: string, password: string, displayName: string, avatarId?: string) => {
        try {
            set({ error: null });
            if (!email.endsWith('@insel.ch')) {
                throw new Error('Nur @insel.ch E-Mail-Adressen sind erlaubt.');
            }
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const profileData = {
                uid: cred.user.uid,
                displayName,
                email,
                avatarId: avatarId || 'doctor',
                createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', cred.user.uid), profileData);

            // Use local Date for state immediately
            const profile: UserProfile = {
                ...profileData,
                createdAt: new Date(),
            } as unknown as UserProfile;
            set({ profile });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            set({ error: msg });
        }
    },

    signIn: async (email: string, password: string) => {
        try {
            set({ error: null });
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            set({ error: msg });
        }
    },

    logout: async () => {
        await signOut(auth);
        set({ user: null, profile: null });
    },

    updateProfile: async (data: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) return;
        await setDoc(doc(db, 'users', user.uid), data, { merge: true });
        set(state => ({ profile: state.profile ? { ...state.profile, ...data } : null }));
    },

    clearError: () => set({ error: null }),
}));

// Initialize auth listener
if (typeof window !== 'undefined') {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const profileDoc = await getDoc(doc(db, 'users', user.uid));
            const profile = profileDoc.exists()
                ? (profileDoc.data() as UserProfile)
                : null;
            useAuthStore.setState({ user, profile, loading: false });
        } else {
            useAuthStore.setState({ user: null, profile: null, loading: false });
        }
    });
}
