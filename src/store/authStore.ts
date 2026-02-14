"use client";

import { create } from 'zustand';
import { auth, db } from '@/lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';

interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    errorCode: string | null;
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
    errorCode: null,

    signUp: async (email: string, password: string, displayName: string, avatarId?: string) => {
        try {
            set({ error: null, errorCode: null });
            if (!email.endsWith('@insel.ch')) {
                throw new Error('Nur @insel.ch E-Mail-Adressen sind erlaubt.');
            }
            const cred = await createUserWithEmailAndPassword(auth, email, password);

            // Send verification email
            console.log("Attempting to send verification email to:", cred.user.email);
            await sendEmailVerification(cred.user);
            console.log("Verification email sent successfully.");

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
        } catch (err: any) {
            console.error("Signup error:", err);
            let msg = 'Ein unbekannter Fehler ist aufgetreten.';
            let code = err.code || 'unknown';

            if (err.code === 'auth/email-already-in-use') {
                msg = 'Diese E-Mail-Adresse wird bereits verwendet. Bitte melde dich an.';
            } else if (err.code === 'auth/weak-password') {
                msg = 'Das Passwort ist zu schwach. Es muss mindestens 6 Zeichen lang sein.';
            } else if (err.code === 'auth/invalid-email') {
                msg = 'Die E-Mail-Adresse ist ungültig.';
            } else if (err.message) {
                msg = err.message;
            }

            set({ error: msg, errorCode: code });
        }
    },

    signIn: async (email: string, password: string) => {
        try {
            set({ error: null, errorCode: null });
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            if (!userCredential.user.emailVerified) {
                // Attempt to resend verification email
                try {
                    console.log("Attempting to RESEND verification email to:", userCredential.user.email);
                    await sendEmailVerification(userCredential.user);
                    console.log("Verification email resent successfully.");
                } catch (resendErr) {
                    console.error("Failed to resend verification email", resendErr);
                }

                await signOut(auth);
                const err = new Error('E-Mail nicht bestätigt. Wir haben dir einen neuen Bestätigungslink gesendet.');
                (err as any).code = 'auth/unverified-email';
                throw err;
            }
        } catch (err: any) {
            console.error("Sign in error:", err);
            let msg = 'Ein unbekannter Fehler ist aufgetreten.';
            let code = err.code || 'unknown';

            if (code === 'auth/unverified-email') {
                msg = err.message;
            } else if (code === 'auth/invalid-email') {
                msg = 'Die E-Mail-Adresse ist ungültig.';
            } else if (code === 'auth/user-disabled') {
                msg = 'Dieses Konto wurde deaktiviert.';
            } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                msg = 'E-Mail oder Passwort ist falsch.';
            } else if (err.message) {
                msg = err.message;
            }

            set({ error: msg, errorCode: code });
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

    clearError: () => set({ error: null, errorCode: null }),
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
