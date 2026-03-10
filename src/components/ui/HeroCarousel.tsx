'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Play, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBackdropBrightness } from '@/lib/hooks/useBackdropBrightness';

interface HeroMovie {
    id: string;
    title: string;
    year: number;
    posterUrl: string | null;
    backdropUrl: string | null;
    description: string;
    averageRating: number | null;
}

interface HeroCarouselProps {
    movies: HeroMovie[];
    isLoggedIn: boolean;
}

const INTERVAL = 10000; // 10 seconds

export default function HeroCarousel({ movies, isLoggedIn }: HeroCarouselProps) {
    const [current, setCurrent] = useState(0);
    const [visible, setVisible] = useState(0); // lags behind for crossfade
    const [transitioning, setTransitioning] = useState(false);
    const backdropBrightness = useBackdropBrightness();

    const goTo = useCallback((next: number) => {
        if (transitioning || next === current) return;
        setTransitioning(true);
        // After fade-out, swap visible and fade back in
        setTimeout(() => {
            setVisible(next);
            setCurrent(next);
            setTransitioning(false);
        }, 500);
    }, [transitioning, current]);

    const prev = () => goTo((current - 1 + movies.length) % movies.length);
    const next = useCallback(() => goTo((current + 1) % movies.length), [current, goTo, movies.length]);

    // Auto-advance
    useEffect(() => {
        const timer = setInterval(next, INTERVAL);
        return () => clearInterval(timer);
    }, [next]);

    if (!movies.length) return null;

    const movie = movies[visible];

    return (
        <section style={{
            position: 'relative',
            height: '80vh',
            minHeight: '600px',
            display: 'flex',
            alignItems: 'flex-end',
            padding: 'var(--space-3xl) 0 60px',
            marginTop: 'calc(var(--header-height) * -1)',
            overflow: 'hidden',
        }}>
            {/* Backdrop layers — one per movie, all stacked, only active one visible */}
            {movies.map((m, i) => (
                <div
                    key={m.id}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        backgroundImage: `url(${m.backdropUrl || m.posterUrl || ''})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 25%',
                        filter: `blur(2px) brightness(${(backdropBrightness / 100).toFixed(2)})`,
                        transform: 'scale(1.04)',
                        opacity: i === visible ? 1 : 0,
                        transition: 'opacity 0.6s ease',
                    }}
                />
            ))}

            {/* Vignette */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 60%, rgba(26,29,33,0.75) 100%), linear-gradient(to right, var(--bg-primary) 0%, transparent 55%)',
            }} />

            {/* Content */}
            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <div
                    style={{
                        maxWidth: '600px',
                        opacity: transitioning ? 0 : 1,
                        transform: transitioning ? 'translateY(12px)' : 'translateY(0)',
                        transition: 'opacity 0.4s ease, transform 0.4s ease',
                    }}
                >
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        {movie.averageRating && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.06em',
                                color: 'var(--brand)', background: 'rgba(0,209,193,0.12)',
                                border: '1px solid rgba(0,209,193,0.25)',
                                padding: '4px 10px', borderRadius: 'var(--radius-full)',
                            }}>
                                <Star size={12} fill="currentColor" /> {movie.averageRating} / 10 &nbsp;·&nbsp; TMDB
                            </span>
                        )}
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        marginBottom: 'var(--space-md)',
                        color: 'var(--text-primary)',
                    }}>
                        {movie.title}
                    </h1>

                    <p style={{
                        fontSize: 'var(--text-lg)',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--space-xl)',
                        lineHeight: 1.6,
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}>
                        {movie.description}
                    </p>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Link
                            href={`/movies/${movie.id}`}
                            className="btn btn-primary btn-lg"
                            style={{ borderRadius: 'var(--radius-full)', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <Play size={18} fill="currentColor" /> View Film
                        </Link>
                        {!isLoggedIn && (
                            <Link
                                href="/register"
                                className="btn btn-secondary btn-lg"
                                style={{ borderRadius: 'var(--radius-full)', color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
                            >
                                Join FrameVault
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Prev / Next arrows */}
            {movies.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        aria-label="Previous film"
                        style={{
                            position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                            zIndex: 20, width: 44, height: 44, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(6px)', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <button
                        onClick={next}
                        aria-label="Next film"
                        style={{
                            position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                            zIndex: 20, width: 44, height: 44, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(6px)', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
                    >
                        <ChevronRight size={22} />
                    </button>
                </>
            )}

            {/* Dot indicators + progress bar */}
            <div style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                zIndex: 20, display: 'flex', gap: 8, alignItems: 'center',
            }}>
                {movies.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i)}
                        aria-label={`Go to film ${i + 1}`}
                        style={{
                            width: i === current ? 28 : 8,
                            height: 8,
                            borderRadius: 4,
                            background: i === current ? 'var(--brand)' : 'rgba(255,255,255,0.35)',
                            border: 'none', cursor: 'pointer', padding: 0,
                            transition: 'all 0.3s ease',
                        }}
                    />
                ))}
            </div>

            {/* Progress bar at the bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, zIndex: 20, background: 'rgba(255,255,255,0.08)' }}>
                <div
                    key={current} // reset animation on slide change
                    style={{
                        height: '100%',
                        background: 'var(--brand)',
                        animation: `heroProgress ${INTERVAL}ms linear forwards`,
                    }}
                />
            </div>

            <style>{`
                @keyframes heroProgress {
                    from { width: 0% }
                    to   { width: 100% }
                }
            `}</style>
        </section>
    );
}
