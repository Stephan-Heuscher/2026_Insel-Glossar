"use client";

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { AVATARS } from '@/lib/types';
import { BookOpen, Plus, Brain, User, LogOut, Menu, X, Share2 } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const { user, profile, logout } = useAuthStore();
    const [mobileOpen, setMobileOpen] = useState(false);

    const avatar = AVATARS.find(a => a.id === profile?.avatarId);

    return (
        <nav className="navbar">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 no-underline">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-lg font-bold">
                            I
                        </div>
                        <div>
                            <span className="text-lg font-bold text-white tracking-tight">Insel</span>
                            <span className="text-lg font-bold text-teal-400 tracking-tight">Glossar</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all no-underline">
                            <BookOpen size={16} />
                            Glossar
                        </Link>
                        {user && (
                            <Link href="/add" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all no-underline">
                                <Plus size={16} />
                                Beitragen
                            </Link>
                        )}
                        <Link href="/quiz" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all no-underline">
                            <Brain size={16} />
                            Quiz
                        </Link>
                        <Link href="/graph" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all no-underline">
                            <Share2 size={16} />
                            Graph
                        </Link>
                    </div>

                    {/* User area */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <Link href="/profile" className="flex items-center gap-2 no-underline">
                                    <div className="avatar-circle w-9 h-9 text-base">
                                        {avatar?.emoji || '🩺'}
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">
                                        {profile?.displayName || 'Profil'}
                                    </span>
                                </Link>
                                <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Abmelden">
                                    <LogOut size={16} />
                                </button>
                            </>
                        ) : (
                            <Link href="/login" className="btn-primary text-sm no-underline">
                                Anmelden
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-white/5"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1">
                    <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 no-underline">
                        <BookOpen size={16} /> Glossar
                    </Link>
                    {user && (
                        <Link href="/add" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 no-underline">
                            <Plus size={16} /> Beitragen
                        </Link>
                    )}
                    <Link href="/quiz" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 no-underline">
                        <Brain size={16} /> Quiz
                    </Link>
                    <Link href="/graph" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 no-underline">
                        <Share2 size={16} /> Graph
                    </Link>
                    {user ? (
                        <>
                            <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 no-underline">
                                <User size={16} /> Profil
                            </Link>
                            <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 w-full text-left">
                                <LogOut size={16} /> Abmelden
                            </button>
                        </>
                    ) : (
                        <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-primary text-sm w-full justify-center no-underline">
                            Anmelden
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
