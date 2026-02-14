"use client";

import { useEffect, useState } from 'react';
import { useGlossaryStore } from '@/store/glossaryStore';
import { useAuthStore } from '@/store/authStore';
import { Search, BookOpen, Users, Brain, ChevronRight, Sparkles, Filter, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { GlossaryTerm } from '@/lib/types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function HomePage() {
  const { terms, loading, searchQuery, filterLetter, filterContext, setSearchQuery, setFilterLetter, setFilterContext, getFilteredTerms, subscribeToTerms } = useGlossaryStore();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsub = subscribeToTerms();
    return unsub;
  }, []);

  const filtered = mounted ? getFilteredTerms() : [];

  // Derive unique contexts sorted by number of entries (most popular first)
  const contexts = mounted
    ? Array.from(new Set(terms.map(t => t.context).filter(Boolean)))
      .map(ctx => ({ name: ctx, count: terms.filter(t => t.context === ctx).length }))
      .sort((a, b) => b.count - a.count)
    : [];

  if (!mounted) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="space-y-5 animate-in">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl px-5 py-4 sm:px-6 sm:py-5 text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-lg shadow-lg flex-shrink-0">
            📖
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="text-white">Insel</span>
            <span className="text-teal-400">Glossar</span>
          </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Das gemeinschaftliche Fachbegriffe-Glossar des Inselspitals Bern.
        </p>
        <p className="text-slate-500 text-[11px] max-w-xl mx-auto border-t border-white/10 pt-2">
          Ein öffentlicher Service, der frei zugängliche Daten sowie das Wissen von Insel-Mitarbeitenden vereint.
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-5 pt-1">
          <div className="text-center">
            <div className="text-lg font-bold text-teal-400">{terms.length}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Begriffe</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">
              {terms.filter(t => t.eselsleitern?.length > 0).length}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Eselsleitern</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">
              {terms.filter(t => t.einfacheSprache).length}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Einfache Sprache</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Begriffe suchen..."
          className="input-field pr-11 text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Context filter chips */}
      {contexts.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-hidden max-h-8">
          <button
            className={`badge ${filterContext === '' ? 'badge-teal' : ''} cursor-pointer transition-all hover:opacity-80`}
            onClick={() => setFilterContext('')}
          >
            <Filter size={12} /> Alle
          </button>
          {contexts.map(ctx => (
            <button
              key={ctx.name}
              className={`badge ${filterContext === ctx.name ? 'badge-teal' : ''} cursor-pointer transition-all hover:opacity-80`}
              onClick={() => setFilterContext(filterContext === ctx.name ? '' : ctx.name)}
            >
              {ctx.name} ({ctx.count})
            </button>
          ))}
        </div>
      )}

      {/* Alphabet nav */}
      <div className="alpha-nav">
        <button
          className={`alpha-btn ${filterLetter === '' ? 'active' : ''}`}
          onClick={() => setFilterLetter('')}
        >
          Alle
        </button>
        {ALPHABET.map(letter => (
          <button
            key={letter}
            className={`alpha-btn ${filterLetter === letter ? 'active' : ''}`}
            onClick={() => setFilterLetter(filterLetter === letter ? '' : letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'Begriff' : 'Begriffe'} gefunden
        </p>
        {user && (
          <Link href="/add" className="btn-primary text-sm no-underline">
            <Plus size={14} /> Neuer Begriff
          </Link>
        )}
      </div>

      {/* Term list */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">🔍</div>
          <h3 className="text-lg font-semibold text-slate-300">Keine Begriffe gefunden</h3>
          <p className="text-slate-500">
            {searchQuery
              ? `Keine Ergebnisse für "${searchQuery}"`
              : 'Noch keine Begriffe vorhanden.'}
          </p>
          {user && (
            <Link href="/add" className="btn-primary inline-flex no-underline mt-4">
              <Sparkles size={16} /> Ersten Begriff hinzufügen
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 stagger">
          {filtered.map((term) => (
            <TermCard key={term.id} term={term} />
          ))}
        </div>
      )}
    </div>
  );
}

function TermCard({ term }: { term: GlossaryTerm }) {
  return (
    <div className="glass-card p-5 flex items-start justify-between gap-4 group relative hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors">
            <Link href={`/term?id=${term.id}`} className="after:absolute after:inset-0 focus:outline-none">
              {term.term}
            </Link>
          </h3>
          {term.status === 'pending' && <span className="badge badge-amber relative z-10">Entwurf</span>}
          {term.eselsleitern?.length > 0 && <span className="badge badge-amber relative z-10">🐴 Eselsleiter</span>}
          {term.einfacheSprache && <span className="badge badge-purple relative z-10">💬 Einfache Sprache</span>}
        </div>
        {term.context && (
          <p className="text-xs text-teal-400/70 mb-1 relative z-10 w-fit">{term.context}</p>
        )}
        <p className="text-sm text-slate-400 line-clamp-2 mb-2">
          {term.definitionDe || term.definitionEn}
        </p>
        <div className="flex items-center gap-3 text-xs text-slate-600 relative z-10 pointer-events-none">
          <span className="pointer-events-auto">von {term.createdByName}</span>
          {(term.source || term.sourceUrl) && (
            term.sourceUrl ? (
              <a
                href={term.sourceUrl}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1 hover:text-teal-400 transition-colors pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                • {term.source || 'Quelle'} <ExternalLink size={10} />
              </a>
            ) : (
              <span className="pointer-events-auto">• {term.source || 'Quelle vorhanden'}</span>
            )
          )}
        </div>
      </div>
      <div className="text-slate-600 group-hover:text-teal-400 transition-colors mt-1 flex-shrink-0 relative z-10 pointer-events-none">
        <ChevronRight size={18} />
      </div>
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
