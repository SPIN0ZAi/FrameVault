'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Film, Loader2, ArrowLeft } from 'lucide-react';

interface Top250Movie {
    rank: number;
    id: number;
    title: string;
    year: number;
    posterUrl: string | null;
    rating: number | null;
}

export default function Top250Page() {
    const [movies, setMovies] = useState<Top250Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'grid' | 'list'>('list');

    useEffect(() => {
        fetch('/api/lists/top250')
            .then((r) => r.json())
            .then((d) => { if (d.success) setMovies(d.data); })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="page">
            <div className="container">
                <Link href="/lists" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-lg)', textDecoration: 'none' }}>
                    <ArrowLeft size={15} /> Back to Lists
                </Link>

                {/* Header */}
                <div style={{ marginBottom: 'var(--space-2xl)', paddingBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <Star size={28} fill="#f59e0b" color="#f59e0b" />
                        <div>
                            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Global · Official</div>
                            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, lineHeight: 1.1 }}>Top 250 Films of All Time</h1>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 600 }}>
                        The 250 highest-rated films on TMDB, ranked by community ratings from millions of viewers worldwide.
                    </p>
                    <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{loading ? '—' : movies.length} films</span>
                        <span style={{ color: 'var(--border-strong)' }}>·</span>
                        {/* View toggle */}
                        <div style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            {(['list', 'grid'] as const).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    style={{
                                        padding: '4px 14px',
                                        background: view === v ? 'var(--brand)' : 'transparent',
                                        color: view === v ? '#000' : 'var(--text-secondary)',
                                        border: 'none', cursor: 'pointer', fontWeight: 600,
                                        fontSize: 'var(--text-xs)', textTransform: 'capitalize',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3xl)', gap: 'var(--space-md)' }}>
                        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Fetching the top 250…</p>
                    </div>
                ) : view === 'list' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {movies.map((movie) => (
                            <Link
                                key={movie.rank}
                                href={`/movies/${movie.id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                                        padding: '10px var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    {/* Rank */}
                                    <div style={{
                                        minWidth: 44, textAlign: 'right',
                                        fontSize: movie.rank <= 10 ? 'var(--text-xl)' : 'var(--text-base)',
                                        fontWeight: 800,
                                        color: movie.rank <= 3 ? '#f59e0b' : movie.rank <= 10 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}>
                                        {movie.rank}
                                    </div>

                                    {/* Poster */}
                                    <div style={{ width: 40, height: 60, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-primary)' }}>
                                        {movie.posterUrl
                                            ? <img src={movie.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={16} style={{ opacity: 0.3 }} /></div>
                                        }
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 700, fontSize: 'var(--text-base)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {movie.title}
                                        </p>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{movie.year}</p>
                                    </div>

                                    {/* Rating */}
                                    {movie.rating !== null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums' }}>{movie.rating}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    /* Grid view */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-md)' }}>
                        {movies.map((movie) => (
                            <Link key={movie.rank} href={`/movies/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', marginBottom: 8 }}>
                                        {movie.posterUrl
                                            ? <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={32} style={{ opacity: 0.3 }} /></div>
                                        }
                                        {/* Rank badge */}
                                        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 800, color: movie.rank <= 10 ? '#f59e0b' : 'white' }}>
                                            #{movie.rank}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{movie.title}</p>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{movie.year}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
