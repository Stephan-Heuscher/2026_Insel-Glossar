"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const { signIn, signUp, error, clearError, loading } = useAuthStore();
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setSubmitting(true);

        try {
            if (isSignUp) {
                await signUp(email, password, displayName);
            } else {
                await signIn(email, password);
            }
            // If no error was set, auth was successful
            router.push('/');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 animate-in">
            <div className="glass-card p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="text-4xl mb-3">🏥</div>
                    <h1 className="text-2xl font-extrabold text-white">
                        {isSignUp ? 'Konto erstellen' : 'Anmelden'}
                    </h1>
                    <p className="text-sm text-slate-400">
                        {isSignUp
                            ? 'Erstelle dein InselGlossar-Konto mit deiner @insel.ch E-Mail'
                            : 'Melde dich mit deinem InselGlossar-Konto an'}
                    </p>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="label">Anzeigename</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    className="input-field pl-10"
                                    placeholder="Dein Name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="label">E-Mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="email"
                                className="input-field pl-10"
                                placeholder="vorname.nachname@insel.ch"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        {isSignUp && (
                            <p className="text-xs text-slate-500 mt-1">Nur @insel.ch Adressen sind erlaubt</p>
                        )}
                    </div>

                    <div>
                        <label className="label">Passwort</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="password"
                                className="input-field pl-10"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
                        {submitting ? <div className="spinner" style={{ width: 18, height: 18 }} /> : (
                            <>
                                {isSignUp ? 'Konto erstellen' : 'Anmelden'}
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); clearError(); }}
                        className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                    >
                        {isSignUp
                            ? 'Bereits ein Konto? Anmelden'
                            : 'Noch kein Konto? Registrieren'}
                    </button>
                </div>
            </div>
        </div>
    );
}
