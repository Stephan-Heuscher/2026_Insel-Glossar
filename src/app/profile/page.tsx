"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AVATARS, QuizResult } from '@/lib/types';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Trophy, Trash2, Save } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, profile, updateProfile } = useAuthStore();
    const [displayName, setDisplayName] = useState('');
    const [avatarId, setAvatarId] = useState('');
    const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (profile) {
            // eslint-disable-next-line
            setDisplayName(profile.displayName);
            setAvatarId(profile.avatarId);
        }
    }, [profile]);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'users', user.uid, 'quizResults'),
            orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(q, (snap) => {
            setQuizResults(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizResult)));
        });
        return unsub;
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        await updateProfile({ displayName, avatarId });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleDeleteResult = async (resultId: string) => {
        if (!user || !confirm('Dieses Quizergebnis löschen?')) return;
        await deleteDoc(doc(db, 'users', user.uid, 'quizResults', resultId));
    };

    if (!user) {
        return (
            <div className="text-center py-20 space-y-4 animate-in">
                <div className="text-5xl">🔐</div>
                <h2 className="text-xl font-bold text-slate-300">Anmeldung erforderlich</h2>
                <Link href="/login" className="btn-primary inline-flex no-underline">Anmelden</Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in">
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
                <User size={24} /> Mein Profil
            </h1>

            {/* Profile card */}
            <div className="glass-card p-6 space-y-6">
                <div>
                    <label className="label">Pseudonym</label>
                    <input className="input-field" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>

                <div>
                    <label className="label">Avatar wählen</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-2">
                        {AVATARS.map(a => (
                            <button
                                key={a.id}
                                onClick={() => setAvatarId(a.id)}
                                className={`avatar-circle w-14 h-14 text-2xl ${avatarId === a.id ? 'selected' : ''}`}
                                title={a.label}
                            >
                                {a.emoji}
                            </button>
                        ))}
                    </div>
                    {avatarId && (
                        <p className="text-xs text-slate-500 mt-2">
                            {AVATARS.find(a => a.id === avatarId)?.label}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleSave} className="btn-primary" disabled={saving}>
                        {saving ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <><Save size={16} /> Speichern</>}
                    </button>
                    {saved && <span className="text-green-400 text-sm animate-in">✓ Gespeichert!</span>}
                </div>

                <div className="pt-4 border-t border-white/5">
                    <p className="text-sm text-slate-500">E-Mail: {profile?.email}</p>
                </div>
            </div>

            {/* Quiz Results */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy size={20} className="text-amber-400" /> Quiz-Ergebnisse
                </h2>

                {quizResults.length === 0 ? (
                    <div className="glass-card p-8 text-center space-y-3">
                        <div className="text-4xl">📝</div>
                        <p className="text-slate-400">Noch keine Quiz-Ergebnisse</p>
                        <Link href="/quiz" className="btn-primary inline-flex no-underline">Quiz starten</Link>
                    </div>
                ) : (
                    <div className="space-y-3 stagger">
                        {quizResults.map(result => (
                            <div key={result.id} className="glass-card p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${(result.score / result.totalQuestions) >= 0.8
                                        ? 'bg-green-500/15 text-green-400'
                                        : (result.score / result.totalQuestions) >= 0.5
                                            ? 'bg-amber-500/15 text-amber-400'
                                            : 'bg-red-500/15 text-red-400'
                                        }`}>
                                        {result.score}/{result.totalQuestions}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{Math.round(result.score / result.totalQuestions * 100)}% richtig</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            {result.category && <span className="badge badge-teal text-xs py-0">{result.category}</span>}
                                            <span>{(result.createdAt instanceof Date ? result.createdAt : result.createdAt?.toDate?.())?.toLocaleDateString('de-CH') || 'Kürzlich'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteResult(result.id!)} className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
