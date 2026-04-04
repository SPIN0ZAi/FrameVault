'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Smile, Zap, Moon, Heart, Compass, Sparkles,
    Layers, Clock, Shield, Coffee, ChevronLeft,
    Loader2, RefreshCw, Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MoodMovie {
    id: number;
    mediaType: 'movie' | 'show';
    title: string;
    year: number;
    posterUrl: string | null;
    voteAverage: number;
    overview: string;
}

interface MoodConfig {
    slug: string;
    label: string;
    desc: string;
    icon: LucideIcon;
    gradient: string;
    textColor: string;
}

// ─── Mood catalogue ──────────────────────────────────────────────────────────

const MOODS: MoodConfig[] = [
    {
        slug: 'feel-good',
        label: 'Feel Good',
        desc: 'Light, uplifting & fun',
        icon: Smile,
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        textColor: '#fff',
    },
    {
        slug: 'thrilling',
        label: 'Thrilling',
        desc: 'Edge-of-your-seat tension',
        icon: Zap,
        gradient: 'linear-gradient(135deg, #dc2626 0%, #1e1b4b 100%)',
        textColor: '#fff',
    },
    {
        slug: 'scary',
        label: 'Scary',
        desc: 'Horror & the unknown',
        icon: Moon,
        gradient: 'linear-gradient(135deg, #14532d 0%, #0f172a 100%)',
        textColor: '#fff',
    },
    {
        slug: 'romantic',
        label: 'Romantic',
        desc: 'Love stories & longing',
        icon: Heart,
        gradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
        textColor: '#fff',
    },
    {
        slug: 'adventurous',
        label: 'Adventurous',
        desc: 'Action & grand worlds',
        icon: Compass,
        gradient: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
        textColor: '#fff',
    },
    {
        slug: 'inspired',
        label: 'Inspired',
        desc: 'True stories & moving drama',
        icon: Sparkles,
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        textColor: '#fff',
    },
    {
        slug: 'mind-bending',
        label: 'Mind-Bending',
        desc: 'Sci-fi, mystery & big twists',
        icon: Layers,
        gradient: 'linear-gradient(135deg, #00D1C1 0%, #7c3aed 100%)',
        textColor: '#fff',
    },
    {
        slug: 'nostalgic',
        label: 'Nostalgic',
        desc: 'Classics & childhood favorites',
        icon: Clock,
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
        textColor: '#fff',
    },
    {
        slug: 'epic',
        label: 'Epic',
        desc: 'War, history & grand sagas',
        icon: Shield,
        gradient: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
        textColor: '#fff',
    },
    {
        slug: 'chill',
        label: 'Chill',
        desc: 'Docs, music & easy watching',
        icon: Coffee,
        gradient: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
        textColor: '#fff',
    },
];

// ─── Star helper ─────────────────────────────────────────────────────────────

function StarBadge({ value }: { value: number }) {
    const out5 = (value / 2).toFixed(1);
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            padding: '3px 7px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, color: '#facc15',
        }}>
            <Star size={10} fill="#facc15" color="#facc15" />
            {out5}
        </div>
    );
}

// ─── Mood card ────────────────────────────────────────────────────────────────

function MoodCard({ mood, onClick }: { mood: MoodConfig; onClick: () => void }) {
    const Icon = mood.icon;
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative', cursor: 'pointer', border: 'none',
                borderRadius: 18, overflow: 'hidden',
                background: mood.gradient,
                padding: '28px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                textAlign: 'left',
                transform: hovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.45)' : '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                minHeight: 140,
            }}
        >
            {/* Subtle noise overlay */}
            <div style={{
                position: 'absolute', inset: 0, borderRadius: 'inherit',
                background: 'rgba(255,255,255,0.04)',
                opacity: hovered ? 0 : 1,
                transition: 'opacity 0.2s',
                pointerEvents: 'none',
            }} />

            {/* Icon circle */}
            <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={22} color="#fff" strokeWidth={1.8} />
            </div>

            <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 4 }}>
                    {mood.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>
                    {mood.desc}
                </div>
            </div>
        </button>
    );
}

// ─── Movie result card ────────────────────────────────────────────────────────

function MovieResultCard({ movie }: { movie: MoodMovie }) {
    const [hovered, setHovered] = useState(false);
    return (
        <Link
            href={movie.mediaType === 'show' ? `/shows/${movie.id}` : `/movies/${movie.id}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'block', textDecoration: 'none',
                borderRadius: 12, overflow: 'hidden',
                position: 'relative',
                transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.55)' : '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                background: 'var(--bg-secondary)',
            }}
        >
            {/* Poster */}
            <div style={{ aspectRatio: '2/3', overflow: 'hidden', background: 'var(--bg-tertiary)', position: 'relative' }}>
                {movie.posterUrl ? (
                    <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                        <Star size={32} />
                    </div>
                )}

                {/* Rating badge top-right */}
                {movie.voteAverage > 0 && (
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <StarBadge value={movie.voteAverage} />
                    </div>
                )}

                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                    {movie.mediaType === 'show' ? 'TV' : 'Movie'}
                </div>

                {/* Title overlay at bottom */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    padding: '24px 10px 10px',
                }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                        {movie.title}
                    </div>
                    {movie.year > 0 && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                            {movie.year}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MoodPage() {
    const [selectedMood, setSelectedMood] = useState<MoodConfig | null>(null);
    const [items, setItems] = useState<MoodMovie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMood = async (mood: MoodConfig) => {
        setSelectedMood(mood);
        setLoading(true);
        setError(null);
        setItems([]);
        try {
            const res = await fetch(`/api/movies/mood?mood=${mood.slug}`);
            const data = await res.json();
            if (data.success) {
                setItems(data.data.items || []);
            } else {
                setError('Could not load recommendations. Try again.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSelectedMood(null);
        setItems([]);
        setError(null);
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 1100 }}>

                {/* ── Picker view ─────────────────────────────────── */}
                {!selectedMood && (
                    <>
                        <div className="page-header" style={{ textAlign: 'center' }}>
                            <h1 className="page-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
                                What are you in the mood for?
                            </h1>
                            <p className="page-subtitle">
                                Pick a vibe and we'll find the perfect film for the moment.
                            </p>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 16,
                        }}>
                            {MOODS.map(mood => (
                                <MoodCard key={mood.slug} mood={mood} onClick={() => fetchMood(mood)} />
                            ))}
                        </div>
                    </>
                )}

                {/* ── Results view ─────────────────────────────────── */}
                {selectedMood && (
                    <>
                        {/* Header bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            marginBottom: 'var(--space-xl)',
                            flexWrap: 'wrap',
                        }}>
                            <button
                                onClick={reset}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                                    borderRadius: 999, padding: '7px 14px', cursor: 'pointer',
                                    fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
                                    transition: 'background 0.15s',
                                    flexShrink: 0,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                            >
                                <ChevronLeft size={15} /> Change mood
                            </button>

                            {/* Selected mood pill */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 18px', borderRadius: 999,
                                background: selectedMood.gradient,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                            }}>
                                {(() => { const Icon = selectedMood.icon; return <Icon size={17} color="#fff" />; })()}
                                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                                    {selectedMood.label}
                                </span>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                                    — {selectedMood.desc}
                                </span>
                            </div>

                            {/* Refresh button (only when results loaded) */}
                            {!loading && items.length > 0 && (
                                <button
                                    onClick={() => fetchMood(selectedMood)}
                                    title="Shuffle results"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                                        borderRadius: 999, padding: '7px 14px', cursor: 'pointer',
                                        fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
                                        transition: 'background 0.15s',
                                        marginLeft: 'auto',
                                        flexShrink: 0,
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                >
                                    <RefreshCw size={14} /> Shuffle
                                </button>
                            )}
                        </div>

                        {/* Loading skeleton */}
                        {loading && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-lg)', color: 'var(--text-tertiary)' }}>
                                    <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>Finding movies and TV shows for you…</span>
                                </div>
                                <div className="grid grid-movies">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 12 }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error state */}
                        {!loading && error && (
                            <div style={{
                                textAlign: 'center', padding: 'var(--space-3xl)',
                                color: 'var(--text-tertiary)',
                            }}>
                                <p style={{ marginBottom: 'var(--space-md)' }}>{error}</p>
                                <button
                                    onClick={() => fetchMood(selectedMood)}
                                    className="btn btn-primary btn-sm"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* Movie grid */}
                        {!loading && items.length > 0 && (
                            <>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>
                                    {items.length} pick{items.length !== 1 ? 's' : ''} (movies + TV shows)
                                </p>
                                <div className="grid grid-movies">
                                    {items.map(movie => (
                                        <MovieResultCard key={`${movie.mediaType}-${movie.id}`} movie={movie} />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Empty state */}
                        {!loading && !error && items.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-tertiary)' }}>
                                <p>No results found for this mood. Try shuffling!</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
