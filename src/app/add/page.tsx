"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useGlossaryStore } from '@/store/glossaryStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, functions, db } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { onSnapshot, doc } from 'firebase/firestore';
import { Upload, FileText, Plus, Check, X, AlertTriangle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { User } from 'firebase/auth';
import { UserProfile, GlossaryTerm, QuizQuestion } from '@/lib/types';


import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
// import { generateTermProposal } from '../actions';

export default function AddPage() {
    const { user, profile } = useAuthStore();
    const { addTerm, checkDuplicate, addQuizQuestion, terms } = useGlossaryStore();
    const router = useRouter();
    const [tab, setTab] = useState<'single' | 'pdf'>('single');

    if (!user) {
        return (
            <div className="text-center py-20 space-y-4 animate-in">
                <div className="text-5xl">🔐</div>
                <h2 className="text-xl font-bold text-slate-300">Anmeldung erforderlich</h2>
                <p className="text-slate-500">Bitte melde dich an, um Begriffe beizutragen.</p>
                <Link href="/login" className="btn-primary inline-flex no-underline">Anmelden</Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in">
            <div>
                <h1 className="text-2xl font-extrabold text-white">Begriff beitragen</h1>
                <p className="text-slate-400 mt-1">Einzelner Eintrag oder LinkPDF-Import mit KI-Extraktion</p>
            </div>

            {/* Tabs */}
            <div className="tab-nav w-fit">
                <button className={`tab-btn ${tab === 'single' ? 'active' : ''}`} onClick={() => setTab('single')}>
                    <Plus size={14} className="inline mr-1.5" /> Einzelner Begriff
                </button>
                <button className={`tab-btn ${tab === 'pdf' ? 'active' : ''}`} onClick={() => setTab('pdf')}>
                    <Upload size={14} className="inline mr-1.5" /> Link/PDF-Import
                </button>
            </div>

            {tab === 'single' ? (
                <SingleEntryForm user={user} profile={profile} addTerm={addTerm} checkDuplicate={checkDuplicate} addQuizQuestion={addQuizQuestion} router={router} terms={terms} />
            ) : (
                <PdfImport user={user} profile={profile} addTerm={addTerm} checkDuplicate={checkDuplicate} />
            )}
        </div>
    );
}



interface SingleEntryFormProps {
    user: User;
    profile: UserProfile | null;
    addTerm: (term: Omit<GlossaryTerm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    checkDuplicate: (term: string) => Promise<GlossaryTerm | null>;
    addQuizQuestion: (question: Omit<QuizQuestion, 'id' | 'createdAt'>) => Promise<void>;
    router: AppRouterInstance;
    terms: GlossaryTerm[];
}

function SingleEntryForm({ user, profile, addTerm, checkDuplicate, addQuizQuestion, router, terms }: SingleEntryFormProps) {
    const [form, setForm] = useState({
        term: '',
        context: '',
        definitionDe: '',
        definitionEn: '',
        einfacheSprache: '',
        eselsleitern: [''],
        source: '',
        sourceUrl: '',
    });
    const [duplicate, setDuplicate] = useState<GlossaryTerm | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleGenerateProposal = async () => {
        if (!form.term.trim()) return;
        setGenerating(true);
        try {
            // Extract unique contexts from existing terms
            const existingContexts = Array.from(new Set(terms.map(t => t.context).filter(Boolean)));

            const generateProposalFn = httpsCallable(functions, 'generateTermProposalFn');
            const result = await generateProposalFn({
                term: form.term,
                context: form.context,
                existingContexts
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const proposal = result.data as any;

            setForm(prev => ({
                ...prev,
                definitionEn: proposal.definitionEn || prev.definitionEn,
                einfacheSprache: proposal.einfacheSprache || prev.einfacheSprache,
                eselsleitern: proposal.eselsleitern && proposal.eselsleitern.length > 0 ? proposal.eselsleitern : prev.eselsleitern,
                definitionDe: !prev.definitionDe ? proposal.definitionDe : prev.definitionDe,
                context: proposal.context || prev.context
            }));
        } catch (error) {
            console.error(error);
            alert('Fehler beim Generieren des Vorschlags. (Cloud Function error?)');
        } finally {
            setGenerating(false);
        }
    };

    const handleTermBlur = async () => {
        if (form.term.trim()) {
            const dup = await checkDuplicate(form.term);
            setDuplicate(dup);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const id = await addTerm({
                term: form.term.trim(),
                context: form.context,
                definitionDe: form.definitionDe,
                definitionEn: form.definitionEn,
                einfacheSprache: form.einfacheSprache,
                eselsleitern: form.eselsleitern.filter(e => e.trim()),
                source: form.source,
                sourceUrl: form.sourceUrl,
                status: 'pending',
                createdBy: user.uid,
                createdByName: profile?.displayName || 'Anonym',
            });

            // Auto-generate quiz question from the term
            if (form.definitionDe) {
                await addQuizQuestion({
                    term: form.term.trim(),
                    question: `Was bedeutet "${form.term.trim()}"?`,
                    correctAnswer: form.definitionDe.substring(0, 200),
                    wrongAnswers: [],
                    category: form.context || 'Allgemein',
                    generatedBy: 'manual',
                });
            }

            setSuccess(true);
            setTimeout(() => router.push(`/term?id=${id}`), 1500);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="glass-card p-12 text-center space-y-4 animate-in">
                <div className="text-5xl">✅</div>
                <h2 className="text-xl font-bold text-green-400">Begriff hinzugefügt!</h2>
                <p className="text-slate-400">Du wirst weitergeleitet...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">


            {/* Term */}
            <div className="glass-card p-6 space-y-4">
                <div>
                    <div className='flex items-center justify-between'>
                        <label className="label">Begriff *</label>
                        <button
                            type="button"
                            onClick={handleGenerateProposal}
                            disabled={generating || !form.term.trim()}
                            className="text-xs btn-secondary py-1 px-2 flex items-center gap-1"
                            title="KI-Vorschlag generieren"
                        >
                            {generating ? <span className="animate-spin">✨</span> : <Sparkles size={12} />}
                            {generating ? ' ' : ' Vorschlag'}
                        </button>
                    </div>
                    <input className="input-field" value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} onBlur={handleTermBlur} required placeholder="z.B. Anamnese" />
                    {duplicate && (
                        <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                            <div className="flex items-center gap-2 font-bold">
                                <AlertTriangle size={16} />
                                <span>Existiert bereits{duplicate.context ? ` (Kontext: ${duplicate.context})` : ''}</span>
                            </div>
                            <div className="ml-6 mt-1 text-amber-400/80">
                                <Link href={`/term?id=${duplicate.id}`} className="underline hover:text-amber-300">Zum existierenden Eintrag</Link>
                                <span className="mx-2">•</span>
                                <span>Du kannst den Begriff für einen neuen Kontext trotzdem hinzufügen.</span>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="label">Kontext / Fachbereich</label>
                    <input className="input-field" value={form.context} onChange={e => setForm({ ...form, context: e.target.value })} placeholder="z.B. Kardiologie, Pflege, Administration" />
                </div>
            </div>

            {/* Definitions */}
            <div className="glass-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-teal-400">Definitionen</h3>
                <div>
                    <label className="label">🇩🇪 Deutsch *</label>
                    <textarea className="input-field" value={form.definitionDe} onChange={e => setForm({ ...form, definitionDe: e.target.value })} required rows={3} placeholder="Deutsche Definition/Beschreibung..." />
                </div>
                <div>
                    <label className="label">🇬🇧 English</label>
                    <textarea className="input-field" value={form.definitionEn} onChange={e => setForm({ ...form, definitionEn: e.target.value })} rows={3} placeholder="English definition/description (optional)..." />
                </div>
            </div>

            {/* Einfache Sprache */}
            <div className="einfache-sprache-box space-y-2">
                <label className="label flex items-center gap-2"><span className="text-purple-400">💬</span> Einfache Sprache</label>
                <textarea className="input-field" value={form.einfacheSprache} onChange={e => setForm({ ...form, einfacheSprache: e.target.value })} rows={3} placeholder="Erklärung in einfacher Sprache, die jeder versteht..." />
            </div>

            {/* Eselsleitern */}
            <div className="eselsleiter-box space-y-3">
                <label className="label flex items-center gap-2"><span className="text-amber-400">🐴</span> Eselsleitern (Merkhilfen)</label>
                {form.eselsleitern.map((e, i) => (
                    <div key={i} className="flex gap-2">
                        <input className="input-field flex-1" value={e}
                            onChange={ev => {
                                const arr = [...form.eselsleitern];
                                arr[i] = ev.target.value;
                                setForm({ ...form, eselsleitern: arr });
                            }}
                            placeholder="z.B. SAMPLE = Symptome, Allergien, Medikamente..."
                        />
                        {form.eselsleitern.length > 1 && (
                            <button type="button" onClick={() => setForm({ ...form, eselsleitern: form.eselsleitern.filter((_, j) => j !== i) })} className="btn-danger">×</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, eselsleitern: [...form.eselsleitern, ''] })} className="btn-secondary text-sm">
                    + Weitere Eselsleiter
                </button>
            </div>

            {/* Source */}
            <div className="glass-card p-6 space-y-4">
                <div>
                    <label className="label">📎 Quellenname</label>
                    <input className="input-field" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="z.B. Neuro Pocket 2023" />
                </div>
                <div>
                    <label className="label">🔗 Quellen-Link</label>
                    <input className="input-field" value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://..." />
                </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 justify-end">
                <Link href="/" className="btn-secondary no-underline">Abbrechen</Link>
                <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? <div className="spinner" style={{ width: 18, height: 18 }} /> : (
                        <><Sparkles size={16} /> Begriff hinzufügen</>
                    )}
                </button>
            </div>
        </form >
    );
}

interface PdfImportProps {
    user: User;
    profile: UserProfile | null;
    addTerm: (term: Omit<GlossaryTerm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    checkDuplicate: (term: string) => Promise<GlossaryTerm | null>;
}

function PdfImport({ user, profile, addTerm }: PdfImportProps) {
    const [mode, setMode] = useState<'file' | 'url'>('file');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [progress, setProgress] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [extracted, setExtracted] = useState<any[]>([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f?.type === 'application/pdf') {
            setFile(f);
            setMode('file');
        } else {
            setError('Nur PDF-Dateien sind erlaubt.');
        }
    };

    const handleExtract = async () => {
        if (mode === 'file' && !file) return;
        if (mode === 'url' && !url) return;

        setExtracting(true);
        setError('');
        setProgress('Initialisiere...');

        // Generate a random Request ID
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Subscribe to progress updates
        const unsubscribe = onSnapshot(doc(db, 'extractionStatus', requestId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data?.message) setProgress(data.message);
            }
        });

        try {
            let result;
            if (mode === 'file' && file) {
                // Upload PDF to Storage
                const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(storageRef);

                // Call Cloud Function to extract terms
                const extractPdfFn = httpsCallable(functions, 'extractTermsFromPdfFn');
                result = await extractPdfFn({ pdfUrl: downloadUrl, requestId });
            } else {
                // URL mode
                const extractUrlFn = httpsCallable(functions, 'extractTermsFromUrlFn');
                result = await extractUrlFn({ url, requestId });
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = result.data as any;
            setExtracted(data.terms || []);

            if (!data.terms || data.terms.length === 0) {
                setError('Keine Begriffe gefunden. Versuche es mit einer anderen Datei/URL.');
            }

        } catch (err: unknown) {
            console.error("Extraction error:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError('Fehler bei der Extraktion: ' + message);
        } finally {
            unsubscribe();
            setExtracting(false);
            setProgress('');
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAcceptTerm = async (term: any, index: number) => {
        await addTerm({
            term: term.term,
            context: term.context || '',
            definitionDe: term.definitionDe || '',
            definitionEn: term.definitionEn || '',
            einfacheSprache: term.einfacheSprache || '',
            eselsleitern: term.eselsleitern || [],
            source: term.source || '',
            sourceUrl: term.sourceUrl || (mode === 'url' ? url : ''),
            status: 'pending',
            createdBy: user.uid,
            createdByName: profile?.displayName || 'Anonym',
        });
        setExtracted(extracted.filter((_, i) => i !== index));
    };

    const handleRejectTerm = (index: number) => {
        setExtracted(extracted.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setMode('file')}
                    className={`text-sm font-medium transition-colors ${mode === 'file' ? 'text-teal-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <Upload size={16} className="inline mr-2" /> PDF-Datei hochladen
                </button>
                <button
                    onClick={() => setMode('url')}
                    className={`text-sm font-medium transition-colors ${mode === 'url' ? 'text-teal-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <LinkIcon size={16} className="inline mr-2" /> URL importieren
                </button>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm flex gap-3">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <p>
                    Bitte stelle sicher, dass das hochgeladene PDF oder der Link öffentlich zugänglich ist,
                    oder du die Berechtigung hast, die Inhalte zu teilen.
                    Dateien werden nach der Extraktion nicht dauerhaft gespeichert.
                </p>
            </div>

            {/* Upload/Input zone */}
            {extracted.length === 0 && (
                <div className="space-y-4">
                    {mode === 'file' ? (
                        <div
                            className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                            <Upload className="mx-auto text-slate-500 mb-4" size={40} />
                            {file ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2 text-teal-400 font-medium">
                                        <FileText size={18} /> {file.name}
                                    </div>
                                    <p className="text-slate-500 text-sm">Klicke auf &quot;Begriffe extrahieren&quot; um fortzufahren</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-slate-300 font-medium">PDF hierher ziehen oder klicken</p>
                                    <p className="text-slate-500 text-sm">Die KI extrahiert automatisch Fachbegriffe aus dem Dokument</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-card p-6 space-y-4">
                            <label className="label">Webseite oder PDF URL</label>
                            <input
                                type="url"
                                className="input-field"
                                placeholder="https://example.com/artikel oder https://.../datei.pdf"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                            />
                            <p className="text-xs text-slate-500">
                                Die KI versucht, Inhalte von der Webseite oder dem verlinkten PDF zu extrahieren.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {((mode === 'file' && file) || (mode === 'url' && url)) && extracted.length === 0 && (
                <button onClick={handleExtract} className="btn-primary w-full justify-center" disabled={extracting}>
                    {extracting ? (
                        <><div className="spinner" style={{ width: 18, height: 18 }} /> {progress || 'Begriffe werden extrahiert...'}</>
                    ) : (
                        <><Sparkles size={16} /> Begriffe extrahieren</>
                    )}
                </button>
            )}

            {/* Review extracted terms */}
            {extracted.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">{extracted.length} Begriffe gefunden</h3>
                        <span className="badge badge-teal">KI-Extraktion</span>
                    </div>
                    {extracted.map((term, i) => (
                        <div key={i} className="glass-card p-5 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-white">{term.term}</h4>
                                    {term.context && <span className="text-xs text-teal-400">{term.context}</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAcceptTerm(term, i)} className="btn-primary text-sm">
                                        <Check size={14} /> Übernehmen
                                    </button>
                                    <button onClick={() => handleRejectTerm(i)} className="btn-danger text-sm">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400">{term.definitionDe}</p>
                            <div className="text-xs text-slate-500 mt-2">
                                {term.source && <span className="mr-2">Gefunden in: {term.source}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function LinkIcon({ size, className }: { size: number, className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    );
}
