"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { useGlossaryStore } from '@/store/glossaryStore';
import dynamic from 'next/dynamic';
import { Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// react-force-graph doesn't support SSR properly because of canvas
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphNode {
    id: string;
    name: string;
    val: number;
    color: string;
    type: 'context' | 'term';
    x?: number;
    y?: number;
    __bckgDimensions?: number[];
}

export default function GraphPage() {
    const { terms, loading, subscribeToTerms } = useGlossaryStore();
    const [mounted, setMounted] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graphRef = useRef<any>(null);

    useEffect(() => {
        setMounted(true);
        const unsub = subscribeToTerms();
        return unsub;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const graphData = useMemo(() => {
        if (!terms.length) return { nodes: [], links: [] };

        const nodes: GraphNode[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const links: { source: string; target: string }[] = [];

        // Context nodes
        const contexts = Array.from(new Set(terms.map(t => t.context).filter(Boolean)));
        contexts.forEach(ctx => {
            nodes.push({ id: `ctx_${ctx}`, name: ctx, val: 5, color: '#14b8a6', type: 'context' }); // teal-500
        });

        // Term nodes
        terms.forEach(term => {
            if (!term.id) return;
            nodes.push({ id: term.id, name: term.term, val: 2, color: '#94a3b8', type: 'term' }); // slate-400
            if (term.context) {
                links.push({ source: term.id, target: `ctx_${term.context}` });
            }
        });

        return { nodes, links };
    }, [terms]);

    if (!mounted || loading) {
        return <div className="flex justify-center py-20"><div className="spinner" /></div>;
    }

    return (
        <div className="space-y-4 animate-in flex flex-col h-[calc(100vh-120px)]">
            <div className="flex items-center gap-3">
                <Link href="/" className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                    <Share2 size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">Wissensgraph</h1>
                    <p className="text-xs text-slate-400">Verknüpfungen der Fachbereiche</p>
                </div>
            </div>

            <div className="flex-1 w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
                <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    nodeLabel="name"
                    linkColor={() => 'rgba(255,255,255,0.05)'}
                    backgroundColor="#0f172a"
                    onNodeClick={(nodeObj) => {
                        const node = nodeObj as GraphNode;
                        if (node.type === 'term') {
                            window.location.href = `/term?id=${node.id}`;
                        } else {
                            graphRef.current?.centerAt(node.x, node.y, 1000);
                            graphRef.current?.zoom(4, 2000);
                        }
                    }}
                    nodeCanvasObject={(nodeObj, ctx, globalScale) => {
                        const node = nodeObj as GraphNode;
                        if (node.x === undefined || node.y === undefined) return;

                        const label = node.name;
                        const fontSize = node.type === 'context' ? 14 / globalScale : 10 / globalScale;
                        ctx.font = `${node.type === 'context' ? 'bold' : 'normal'} ${fontSize}px Inter, Arial, sans-serif`;
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

                        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // slate-900 background
                        ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = node.color || '#fff';
                        ctx.fillText(label, node.x, node.y);

                        node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
                    }}
                    nodePointerAreaPaint={(nodeObj, color, ctx) => {
                        const node = nodeObj as GraphNode;
                        if (node.x === undefined || node.y === undefined) return;

                        ctx.fillStyle = color;
                        const bckgDimensions = node.__bckgDimensions;
                        if (bckgDimensions) {
                            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
                        }
                    }}
                />
                <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur text-xs px-3 py-2 rounded-lg text-slate-300 pointer-events-none">
                    <span className="font-bold text-teal-400">Tipp:</span> Zoomen & Ziehen. Begriffe antippen für Details.
                </div>
            </div>
        </div>
    );
}
