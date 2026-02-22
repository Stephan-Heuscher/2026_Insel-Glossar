"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { AVATARS } from '@/lib/types';
import { ArrowRight, User, ExternalLink, ShieldCheck } from 'lucide-react';

// Google "G" logo as inline SVG
function GoogleLogo({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

const VALID_NAMES = ['stephan', 'heuscher', 'stephan heuscher'];

export default function LoginPage() {
    const { signInWithGoogle, createProfile, user, needsVerification, error, clearError } = useAuthStore();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Verification challenge state
    const [verificationAnswer, setVerificationAnswer] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [displayName, setDisplayName] = useState('');

    // Random default avatar for new registrations
    const randomAvatarId = useMemo(
        () => AVATARS[Math.floor(Math.random() * AVATARS.length)].id,
        []
    );
    const [avatarId, setAvatarId] = useState(randomAvatarId);

    const handleGoogleSignIn = async () => {
        clearError();
        setSubmitting(true);
        try {
            await signInWithGoogle();
            const state = useAuthStore.getState();
            if (!state.error && !state.needsVerification) {
                // Returning user with profile — go home
                router.push('/');
            }
            // Otherwise needsVerification=true → show challenge step
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerificationError('');

        const answer = verificationAnswer.trim().toLowerCase();
        if (!VALID_NAMES.includes(answer)) {
            setVerificationError('Das stimmt leider nicht. Versuch es nochmal! 😊');
            return;
        }

        // Verification passed — create profile
        setSubmitting(true);
        try {
            const name = displayName.trim() || user?.displayName || 'Insel-Mitarbeiter';
            await createProfile(name, avatarId);
            const state = useAuthStore.getState();
            if (!state.error) {
                router.push('/');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Step 2: Verification Challenge ───
    if (needsVerification && user) {
        return (
            <div className="max-w-md mx-auto mt-12 animate-in">
                <div className="glass-card p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="text-5xl mb-3">🏥</div>
                        <h1 className="text-2xl font-extrabold text-white">
                            Fast geschafft!
                        </h1>
                        <p className="text-sm text-slate-400">
                            Beweise, dass du zum Inselspital gehörst 😉
                        </p>
                    </div>

                    {/* The challenge */}
                    <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-teal-400 font-medium text-sm">
                            <ShieldCheck size={18} />
                            Verifizierung
                        </div>
                        <p className="text-sm text-slate-300">
                            Öffne den folgenden internen Link und gib den Namen der gezeigten Person ein:
                        </p>
                        <a
                            href="https://inselgruppe.ch.beekeeper.io/posts/15504960"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors text-sm font-medium"
                        >
                            <ExternalLink size={14} />
                            Insel-internen Link öffnen
                        </a>
                    </div>

                    {(verificationError || error) && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {verificationError || error}
                        </div>
                    )}

                    <form onSubmit={handleVerification} className="space-y-4">
                        <div>
                            <label className="label">Wie heisst diese Person?</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Vor- oder Nachname..."
                                value={verificationAnswer}
                                onChange={(e) => setVerificationAnswer(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="label">Dein Pseudonym</label>
                            <div className="relative">
                                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    className="input-field pr-10"
                                    placeholder={user.displayName || 'Dein Pseudonym'}
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Avatar wählen</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {AVATARS.map(a => (
                                    <button
                                        key={a.id}
                                        type="button"
                                        onClick={() => setAvatarId(a.id)}
                                        className={`avatar-circle w-11 h-11 text-lg ${avatarId === a.id ? 'selected' : ''}`}
                                        title={a.label}
                                    >
                                        {a.emoji}
                                    </button>
                                ))}
                            </div>
                            {avatarId && (
                                <p className="text-xs text-slate-500 mt-1.5">
                                    {AVATARS.find(a => a.id === avatarId)?.label}
                                </p>
                            )}
                        </div>

                        <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
                            {submitting ? <div className="spinner" style={{ width: 18, height: 18 }} /> : (
                                <>
                                    Bestätigen
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ─── Step 1: Google Sign-In ───
    return (
        <div className="max-w-md mx-auto mt-12 animate-in">
            <div className="glass-card p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="text-4xl mb-3">🏥</div>
                    <h1 className="text-2xl font-extrabold text-white">
                        Willkommen
                    </h1>
                    <p className="text-sm text-slate-400">
                        Melde dich mit deinem Google-Konto an, um beizutragen
                    </p>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <p>{error}</p>
                    </div>
                )}

                <button
                    onClick={handleGoogleSignIn}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl
                        bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm
                        transition-all duration-200 shadow-lg hover:shadow-xl
                        disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <div className="spinner" style={{ width: 18, height: 18 }} />
                    ) : (
                        <>
                            <GoogleLogo />
                            Mit Google anmelden
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-slate-600">
                    Für Inselspital-Mitarbeitende — neue Konten werden verifiziert
                </p>
            </div>
        </div>
    );
}
