"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useGlossaryStore } from '@/store/glossaryStore';
import { GlossaryTerm } from '@/lib/types';
import { ArrowLeft, ExternalLink, Edit3, Trash2, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function TermPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><div className="spinner" /></div>}>
            <TermPageContent />
        </Suspense>
    );
}

function TermPageContent() {
    const searchParams = useSearchParams();
    const termId = searchParams.get('id');
    const router = useRouter();
    const { user } = useAuthStore();
    const { updateTerm, deleteTerm } = useGlossaryStore();
    const [term, setTerm] = useState<GlossaryTerm | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<GlossaryTerm>>({});

    useEffect(() => {
        async function load() {
            if (!termId) { setLoading(false); return; }
            const snap = await getDoc(doc(db, 'glossary', termId));
            if (snap.exists()) {
                setTerm({ id: snap.id, ...snap.data() } as GlossaryTerm);
            }
            setLoading(false);
        }
        load();
    }, [termId]);

    const handleDelete = async () => {
        if (!term?.id || !confirm('Diesen Begriff wirklich löschen?')) return;
        await deleteTerm(term.id);
        router.push('/');
    };

    const handleSaveEdit = async () => {
        if (!term?.id) return;
        await updateTerm(term.id, editData);
        setTerm({ ...term, ...editData } as GlossaryTerm);
        setEditing(false);
    };

    const startEditing = () => {
        setEditData({
            term: term?.term,
            context: term?.context,
            definitionDe: term?.definitionDe,
            definitionEn: term?.definitionEn,
            einfacheSprache: term?.einfacheSprache,
            eselsleitern: term?.eselsleitern || [],
            source: term?.source,
            sourceUrl: term?.sourceUrl,
        });
        setEditing(true);
    };

    if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;
    if (!term) return (
        <div className="text-center py-20 space-y-4">
            <div className="text-5xl">🚫</div>
            <h2 className="text-xl font-bold text-slate-300">Begriff nicht gefunden</h2>
            <Link href="/" className="btn-primary inline-flex no-underline">← Zurück zum Glossar</Link>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in">
            {/* Back */}
            <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition-colors no-underline">
                <ArrowLeft size={16} /> Zurück zum Glossar
            </Link>

            {/* Header */}
            <div className="glass-card p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        {editing ? (
                            <input
                                className="input-field text-2xl font-bold mb-2"
                                value={editData.term || ''}
                                onChange={e => setEditData({ ...editData, term: e.target.value })}
                            />
                        ) : (
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{term.term}</h1>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                            {term.status === 'pending' && <span className="badge badge-amber">Entwurf</span>}
                            {term.status === 'approved' && <span className="badge badge-green">✓ Geprüft</span>}
                        </div>
                    </div>
                    {user && (
                        <div className="flex gap-2">
                            {editing ? (
                                <>
                                    <button onClick={handleSaveEdit} className="btn-primary text-sm"><Check size={14} /> Speichern</button>
                                    <button onClick={() => setEditing(false)} className="btn-secondary text-sm"><X size={14} /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={startEditing} className="btn-secondary text-sm"><Edit3 size={14} /> Bearbeiten</button>
                                    <button onClick={handleDelete} className="btn-danger text-sm"><Trash2 size={14} /></button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Context */}
            {(editing ? editData.context : term.context) && (
                <div className="glass-card p-6">
                    <h2 className="label">Kontext</h2>
                    {editing ? (
                        <input className="input-field" value={editData.context || ''} onChange={e => setEditData({ ...editData, context: e.target.value })} />
                    ) : (
                        <p className="text-slate-300">{term.context}</p>
                    )}
                </div>
            )}

            {/* Definition DE */}
            <div className="glass-card p-6">
                <h2 className="label">🇩🇪 Definition (Deutsch)</h2>
                {editing ? (
                    <textarea className="input-field" value={editData.definitionDe || ''} onChange={e => setEditData({ ...editData, definitionDe: e.target.value })} rows={4} />
                ) : (
                    <p className="text-slate-300 leading-relaxed">{term.definitionDe || <span className="italic text-slate-600">Keine deutsche Definition</span>}</p>
                )}
            </div>

            {/* Definition EN */}
            <div className="glass-card p-6">
                <h2 className="label">🇬🇧 Definition (English)</h2>
                {editing ? (
                    <textarea className="input-field" value={editData.definitionEn || ''} onChange={e => setEditData({ ...editData, definitionEn: e.target.value })} rows={4} />
                ) : (
                    <p className="text-slate-300 leading-relaxed">{term.definitionEn || <span className="italic text-slate-600">No English definition</span>}</p>
                )}
            </div>

            {/* Einfache Sprache */}
            <div className="einfache-sprache-box">
                <h2 className="label flex items-center gap-2">
                    <span className="text-purple-400">💬</span> Einfache Sprache
                </h2>
                {editing ? (
                    <textarea className="input-field" value={editData.einfacheSprache || ''} onChange={e => setEditData({ ...editData, einfacheSprache: e.target.value })} rows={3} placeholder="Erklärung in einfacher Sprache..." />
                ) : (
                    <p className="text-purple-200/80 leading-relaxed">
                        {term.einfacheSprache || <span className="italic text-slate-600">Noch keine Erklärung in einfacher Sprache</span>}
                    </p>
                )}
            </div>

            {/* Eselsleitern */}
            <div className="eselsleiter-box">
                <h2 className="label flex items-center gap-2">
                    <span className="text-amber-400">🐴</span> Eselsleitern (Merkhilfen)
                </h2>
                {editing ? (
                    <div className="space-y-2">
                        {(editData.eselsleitern || []).map((e, i) => (
                            <div key={i} className="flex gap-2">
                                <input className="input-field flex-1" value={e}
                                    onChange={ev => {
                                        const arr = [...(editData.eselsleitern || [])];
                                        arr[i] = ev.target.value;
                                        setEditData({ ...editData, eselsleitern: arr });
                                    }} />
                                <button onClick={() => {
                                    const arr = (editData.eselsleitern || []).filter((_, j) => j !== i);
                                    setEditData({ ...editData, eselsleitern: arr });
                                }} className="btn-danger">×</button>
                            </div>
                        ))}
                        <button onClick={() => setEditData({ ...editData, eselsleitern: [...(editData.eselsleitern || []), ''] })} className="btn-secondary text-sm">+ Eselsleiter hinzufügen</button>
                    </div>
                ) : (
                    term.eselsleitern?.length > 0 ? (
                        <ul className="space-y-2">
                            {term.eselsleitern.map((e, i) => (
                                <li key={i} className="flex items-start gap-2 text-amber-200/80">
                                    <span className="text-amber-400 mt-0.5">•</span> {e}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="italic text-slate-600">Noch keine Eselsleitern</p>
                    )
                )}
            </div>

            {/* Source */}
            {(editing ? true : (term.source || term.sourceUrl)) && (
                <div className="glass-card p-6 space-y-3">
                    <h2 className="label">📎 Quelle</h2>
                    {editing ? (
                        <div className="space-y-3">
                            <div>
                                <span className="text-xs text-slate-500 mb-1 block">Quellenname</span>
                                <input className="input-field" value={editData.source || ''} onChange={e => setEditData({ ...editData, source: e.target.value })} placeholder="z.B. Neuro Pocket 2023" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 mb-1 block">Quellen-Link</span>
                                <input className="input-field" value={editData.sourceUrl || ''} onChange={e => setEditData({ ...editData, sourceUrl: e.target.value })} placeholder="https://..." />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {term.sourceUrl ? (
                                <a href={term.sourceUrl} target="_blank" rel="noopener" className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors">
                                    <ExternalLink size={14} /> {term.source || term.sourceUrl}
                                </a>
                            ) : (
                                <span className="text-slate-300">{term.source}</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>Erstellt von {term.createdByName}</span>
                {term.reviewedBy && <span>• Geprüft</span>}
            </div>
        </div>
    );
}
