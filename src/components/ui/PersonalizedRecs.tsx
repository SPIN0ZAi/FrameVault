'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Film, Sparkles, Star } from 'lucide-react';
import ScrollRow from './ScrollRow';

interface RecMovie {
    id: number;
    title: string;
    year: number;
    posterUrl: string | null;
    rating: number | null;
    basedOn: string; // title of the source movie
}

export default function PersonalizedRecs() {
    const [movies, setMovies] = useState<RecMovie[]>([]);
    const [loading, setLoading] = useState(true);
    const [basedOnTitles, setBasedOnTitles] = useState<string[]>([]);

    useEffect(() => {
        fetch('/api/recommendations')
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data.length > 0) {
                    setMovies(d.data);
                    // Collect unique source titles (max 3)
                    const titles = [...new Set<string>(d.data.map((m: RecMovie) => m.basedOn))].slice(0, 3) as string[];
                    setBasedOnTitles(titles);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (!loading && movies.length === 0) return null;

    return (
        <section style={{ marginBottom: 'var(--space-3xl)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, #00D1C1 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sparkles size={22} style={{ color: '#00D1C1' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            Picked For You
                        </h2>
                        {basedOnTitles.length > 0 && (
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                Because you loved{' '}
                                {basedOnTitles.map((t, i) => (
                                    <span key={t}>
                                        <em style={{ color: 'var(--text-secondary)', fontStyle: 'normal', fontWeight: 600 }}>{t}</em>
                                        {i < basedOnTitles.length - 1 ? ', ' : ''}
                                    </span>
                                ))}
                            </p>
                        )}
                    </div>
                </div>
                <Link href="/movies" className="btn btn-ghost btn-sm" style={{ fontWeight: 600, flexShrink: 0 }}>
                    Browse All →
                </Link>
            </div>

            {/* Movie row */}
            {loading ? (
                <ScrollRow>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ flex: '0 0 160px', aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />
                    ))}
                </ScrollRow>
            ) : (
                <ScrollRow>
                    {movies.map(movie => (
                        <Link href={`/movies/${movie.id}`} key={movie.id} className="movie-card" style={{ flex: '0 0 160px', cursor: 'pointer' }}>
                            {movie.posterUrl ? (
                                <img src={movie.posterUrl} alt={movie.title} loading="lazy" />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center' }}>
                                    <Film size={40} style={{ opacity: 0.4, marginBottom: 8 }} />
                                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{movie.title}</span>
                                </div>
                            )}
                            {movie.rating && (
                                <div className="movie-card-rating" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Star size={14} fill="currentColor" /> {movie.rating}
                                </div>
                            )}
                            <div className="movie-card-overlay">
                                <div className="movie-card-title">{movie.title}</div>
                                <div className="movie-card-year">{movie.year}</div>
                            </div>
                        </Link>
                    ))}
                </ScrollRow>
            )}
        </section>
    );
}
