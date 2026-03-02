'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Film, Star, RefreshCw } from 'lucide-react';
import ScrollRow from './ScrollRow';

interface Movie {
    id: string;
    title: string;
    year: number;
    posterUrl: string | null;
    averageRating: number | null;
}

const ROTATE_MS = 30_000;

export default function PopularSection() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [pulse, setPulse] = useState(false);
    const [fading, setFading] = useState(false);
    const pageRef = useRef(1);

    const load = async (page: number) => {
        try {
            const res = await fetch(`/api/movies?sort=popular&page=${page}&limit=12`);
            const data = await res.json();
            if (data.success) {
                setFading(true);
                setTimeout(() => {
                    setMovies(data.data.slice(0, 12));
                    setFading(false);
                    setPulse(true);
                    setTimeout(() => setPulse(false), 600);
                }, 300);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const startPage = Math.ceil(Math.random() * 5);
        pageRef.current = startPage;
        load(startPage);

        const interval = setInterval(() => {
            pageRef.current = (pageRef.current % 5) + 1;
            load(pageRef.current);
        }, ROTATE_MS);

        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        pageRef.current = (pageRef.current % 5) + 1;
        setLoading(true);
        load(pageRef.current);
    };

    return (
        <section style={{ marginBottom: 'var(--space-3xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 4, height: 24, background: 'var(--brand)', borderRadius: 2 }} />
                    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Popular Right Now
                    </h2>
                    {/* Live pulse indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: '2px 8px' }}>
                        <span style={{
                            display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                            background: '#ef4444',
                            animation: pulse ? 'none' : 'livePulse 2s ease-in-out infinite',
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: '0.05em' }}>LIVE</span>
                    </div>
                    <style>{`
                        @keyframes livePulse {
                            0%, 100% { opacity: 1; transform: scale(1); }
                            50% { opacity: 0.4; transform: scale(0.8); }
                        }
                    `}</style>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                        onClick={handleRefresh}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'color 0.15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                    >
                        <RefreshCw size={13} />
                        Refresh
                    </button>
                    <Link href="/movies" className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}>
                        Browse All →
                    </Link>
                </div>
            </div>

            <ScrollRow style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease' }}>
                {loading
                    ? Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} style={{ flex: '0 0 160px', height: 240, borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    ))
                    : movies.map((movie) => (
                        <Link href={`/movies/${movie.id}`} key={movie.id} className="movie-card" style={{ flex: '0 0 160px', cursor: 'pointer' }}>
                            {movie.posterUrl ? (
                                <img src={movie.posterUrl} alt={movie.title} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    <Film size={40} style={{ marginBottom: 8, opacity: 0.5 }} />
                                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{movie.title}</span>
                                </div>
                            )}
                            {movie.averageRating && (
                                <div className="movie-card-rating" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Star size={14} fill="currentColor" /> {movie.averageRating}
                                </div>
                            )}
                            <div className="movie-card-overlay">
                                <div className="movie-card-title">{movie.title}</div>
                                <div className="movie-card-year">{movie.year}</div>
                            </div>
                        </Link>
                    ))}
            </ScrollRow>
        </section>
    );
}
