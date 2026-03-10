'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { X, Shuffle } from 'lucide-react';

export interface SpinMovie {
    id: string;
    tmdbId: number | null;
    title: string;
    year: number;
    posterUrl: string | null;
}

const ITEM_HEIGHT = 92;
const VISIBLE = 5;
const CENTER_IDX = 2;

export default function SpinWheelModal({ movies, onClose, accent = 'var(--brand)' }: {
    movies: SpinMovie[];
    onClose: () => void;
    accent?: string;
}) {
    const [phase, setPhase] = useState<'idle' | 'spinning' | 'landed'>('idle');
    const [translateY, setTranslateY] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [winner, setWinner] = useState<SpinMovie | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const REPEATS = Math.min(20, Math.max(8, Math.ceil(200 / movies.length)));
    const displayItems = Array.from({ length: REPEATS }, () => [...movies]).flat();

    const spin = () => {
        if (phase === 'spinning' || movies.length === 0) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const winnerIdx = Math.floor(Math.random() * movies.length);
        const picked = movies[winnerIdx];
        setWinner(picked);
        setPhase('spinning');

        // Land winner in the middle repeat so there's plenty of runway
        const midRepeat = Math.floor(REPEATS / 2);
        const targetIdx = midRepeat * movies.length + winnerIdx;
        const targetTranslateY = -(targetIdx - CENTER_IDX) * ITEM_HEIGHT;

        // Reset to top instantly, then animate
        setAnimating(false);
        setTranslateY(0);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setAnimating(true);
                setTranslateY(targetTranslateY);
                timeoutRef.current = setTimeout(() => setPhase('landed'), 2600);
            });
        });
    };

    const reset = () => {
        setPhase('idle');
        setWinner(null);
        setAnimating(false);
        setTranslateY(0);
    };

    const movieHref = winner ? `/movies/${winner.tmdbId ?? winner.id}` : '#';

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}
        >
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-2xl)', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xl)', position: 'relative' }}>
                {/* Close */}
                <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                    <X size={20} />
                </button>

                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>🎰 Spin the Wheel</h2>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {movies.length} film{movies.length !== 1 ? 's' : ''} in your watchlist
                    </p>
                </div>

                {/* Slot window */}
                <div style={{ position: 'relative', width: '100%', height: ITEM_HEIGHT * VISIBLE, overflow: 'hidden', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)', background: 'var(--bg-primary)' }}>
                    {/* Top fade */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_HEIGHT * 1.8, background: 'linear-gradient(to bottom, var(--bg-primary) 10%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
                    {/* Bottom fade */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_HEIGHT * 1.8, background: 'linear-gradient(to top, var(--bg-primary) 10%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
                    {/* Center highlight bar */}
                    <div style={{ position: 'absolute', top: ITEM_HEIGHT * CENTER_IDX, left: 0, right: 0, height: ITEM_HEIGHT, border: `2px solid ${accent}`, zIndex: 3, pointerEvents: 'none', borderRadius: 6, boxShadow: `0 0 16px ${accent}44` }} />

                    {/* Scrolling strip */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            transform: `translateY(${translateY}px)`,
                            transition: animating ? 'transform 2.4s cubic-bezier(0.12, 0.8, 0.1, 1.0)' : 'none',
                            willChange: 'transform',
                        }}
                    >
                        {displayItems.map((movie, i) => (
                            <div key={i} style={{ height: ITEM_HEIGHT, display: 'flex', alignItems: 'center', gap: 12, padding: '6px 14px', flexShrink: 0 }}>
                                {movie.posterUrl
                                    ? <img src={movie.posterUrl} alt={movie.title} style={{ width: 46, height: 68, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                                    : <div style={{ width: 46, height: 68, background: 'var(--bg-tertiary)', borderRadius: 4, flexShrink: 0 }} />
                                }
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{movie.title}</p>
                                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>{movie.year}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                {phase === 'landed' && winner ? (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', width: '100%' }}>
                        <div>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>Tonight, watch</p>
                            <p style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: accent }}>{winner.title}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', width: '100%' }}>
                            <Link href={movieHref} className="btn btn-primary btn-sm" onClick={onClose} style={{ flex: 1, justifyContent: 'center', background: accent, borderColor: accent }}>
                                View Movie →
                            </Link>
                            <button className="btn btn-ghost btn-sm" onClick={reset} style={{ flex: 1 }}>
                                Spin Again
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={spin}
                        disabled={phase === 'spinning'}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 'var(--radius-lg)', background: accent, color: '#000', fontWeight: 700, fontSize: 'var(--text-sm)', border: 'none', cursor: phase === 'spinning' ? 'default' : 'pointer', opacity: phase === 'spinning' ? 0.7 : 1 }}
                    >
                        <Shuffle size={16} />
                        {phase === 'spinning' ? 'Spinning…' : 'Spin!'}
                    </button>
                )}
            </div>
        </div>
    );
}
