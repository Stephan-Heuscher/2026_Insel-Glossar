"use client";

import { create } from 'zustand';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    where,
    getDocs,
    limit,
} from 'firebase/firestore';
import { GlossaryTerm, QuizQuestion } from '@/lib/types';

interface GlossaryState {
    terms: GlossaryTerm[];
    quizQuestions: QuizQuestion[];
    loading: boolean;
    searchQuery: string;
    filterLetter: string;
    filterContext: string;
    setSearchQuery: (q: string) => void;
    setFilterLetter: (l: string) => void;
    setFilterContext: (c: string) => void;
    addTerm: (term: Omit<GlossaryTerm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateTerm: (id: string, data: Partial<GlossaryTerm>) => Promise<void>;
    deleteTerm: (id: string) => Promise<void>;
    addQuizQuestion: (q: Omit<QuizQuestion, 'id' | 'createdAt'>) => Promise<void>;
    getFilteredTerms: () => GlossaryTerm[];
    getRandomQuizQuestions: (count: number) => QuizQuestion[];
    subscribeToTerms: () => () => void;
    subscribeToQuizQuestions: () => () => void;
    checkDuplicate: (term: string) => Promise<GlossaryTerm | null>;
}

export const useGlossaryStore = create<GlossaryState>((set, get) => ({
    terms: [],
    quizQuestions: [],
    loading: true,
    searchQuery: '',
    filterLetter: '',
    filterContext: '',

    setSearchQuery: (q) => set({ searchQuery: q }),
    setFilterLetter: (l) => set({ filterLetter: l }),
    setFilterContext: (c) => set({ filterContext: c }),

    getFilteredTerms: () => {
        const { terms, searchQuery, filterLetter, filterContext } = get();
        let filtered = terms;
        if (filterContext) {
            filtered = filtered.filter(t => t.context.toLowerCase() === filterContext.toLowerCase());
        }
        if (filterLetter) {
            filtered = filtered.filter(t => t.term.toUpperCase().startsWith(filterLetter));
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.term.toLowerCase().includes(q) ||
                t.definitionDe.toLowerCase().includes(q) ||
                t.definitionEn.toLowerCase().includes(q) ||
                t.context.toLowerCase().includes(q)
            );
        }
        return filtered;
    },

    addTerm: async (term) => {
        const docRef = await addDoc(collection(db, 'glossary'), {
            ...term,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    },

    updateTerm: async (id, data) => {
        await updateDoc(doc(db, 'glossary', id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    deleteTerm: async (id) => {
        await deleteDoc(doc(db, 'glossary', id));
    },

    addQuizQuestion: async (q) => {
        await addDoc(collection(db, 'quizQuestions'), {
            ...q,
            createdAt: serverTimestamp(),
        });
    },

    getRandomQuizQuestions: (count) => {
        const { quizQuestions } = get();
        const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    subscribeToTerms: () => {
        const q = query(collection(db, 'glossary'), orderBy('term', 'asc'));
        const unsub = onSnapshot(q, (snap) => {
            const terms = snap.docs.map(d => ({ id: d.id, ...d.data() } as GlossaryTerm));
            set({ terms, loading: false });
        });
        return unsub;
    },

    subscribeToQuizQuestions: () => {
        const q = query(collection(db, 'quizQuestions'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const quizQuestions = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizQuestion));
            set({ quizQuestions });
        });
        return unsub;
    },

    checkDuplicate: async (term: string) => {
        const q = query(
            collection(db, 'glossary'),
            where('term', '==', term.trim()),
            limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as GlossaryTerm;
    },
}));
