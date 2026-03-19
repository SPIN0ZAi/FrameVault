'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Tv } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ShowHoverCardProps {
    id: string;           // TMDB ID or show ID
    href: string;
    title: string;
    year: number;
    posterUrl: string | null;
    averageRating?: number | null;
}

interface PreviewData {
    backdropUrl: string | null;
    description: string | null;
    cast: { name: string; character: string }[];
}

interface UserRating {
    rating: number | null;
}

// Cache for previews and ratings
const previewCache = new Map<string, PreviewData>();
const ratingCache = new Map<string, UserRating>();

// Star components from shows/[id]/page.tsx
function getHalfStepValue(clientX: number, rect: DOMRect, wholeStar: number): number {
    return clientX - rect.left < rect.width / 2 ? wholeStar - 0.5 : wholeStar;
}

function formatTenthRating(value: number): string {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function StarFill({ level, size = 16 }: { level: 0 | 0.5 | 1; size?: number }) {
    const fillPercent = level === 1 ? 100 : level === 0.5 ? 50 : 0;
    return (
        <span style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--star-filled)', opacity: 0.28, position: 'absolute', inset: 0 }}>
                <path d="M12 2 9.09 8.26 2 9.24l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.11l5-4.87-7.09-1.01L12 2Z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {fillPercent > 0 && (
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--star-filled)', position: 'absolute', inset: 0, overflow: 'hidden', width: `${fillPercent}%` }}>
                    <path d="M12 2 9.09 8.26 2 9.24l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.11l5-4.87-7.09-1.01L12 2Z" stroke="currentColor" strokeWidth={0} />
                </svg>
            )}
        </span>
    );
}

export default function ShowHoverCard({
    id, href, title, year, posterUrl, averageRating,
}: ShowHoverCardProps) {
    const [showPanel, setShowPanel] = useState(false);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState(0);
    const [isRatingLoading, setIsRatingLoading] = useState(false);
    const [side, setSide] = useState<'right' | 'left'>('right');
    const [feedback, setFeedback] = useState('');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();

    const handleMouseEnter = useCallback(() => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setSide(window.innerWidth - rect.right >= 280 ? 'right' : 'left');
        }
        timerRef.current = setTimeout(() => setShowPanel(true), 220);
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowPanel(false);
        setHoverRating(0);
    }, []);

    // Fetch preview and user rating
    useEffect(() => {
        if (!showPanel) return;

        // Preview
        if (!previewCache.has(id)) {
            fetch(`/api/shows/${id}/preview`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data?.success) {
                        previewCache.set(id, data.data);
                        setPreview(data.data);
                    }
                })
                .catch(() => {});
        } else {
            setPreview(previewCache.get(id)!);
        }

        // User rating (if logged in)
        if (session?.user?.id && !ratingCache.has(id)) {
            fetch(`/api/shows/${id}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.data?.userInteraction) {
                        const rating = data.data.userInteraction.rating;
                        ratingCache.set(id, { rating });
                        setUserRating(rating);
                    }
                })
                .catch(() => {});
        } else if (session?.user?.id) {
            setUserRating(ratingCache.get(id)?.rating ?? null);
        }
    }, [showPanel, id, session]);

    const handleRate = async (value: number) => {
        if (!session?.user || isRatingLoading) return;
        setIsRatingLoading(true);
        setFeedback('');

        try {
            const isSame = userRating === value;
            if (isSame) {
                await fetch(`/api/shows/${id}/rating`, { method: 'DELETE' });
                setUserRating(null);
                ratingCache.set(id, { rating: null });
                setFeedback('Rating removed');
            } else {
                await fetch(`/api/shows/${id}/rating`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value }),
                });
                setUserRating(value);
                ratingCache.set(id, { rating: value });
                setFeedback(`${formatTenthRating(value)}/10`);
            }
        } catch {
            setFeedback('Try again');
        } finally {
            setIsRatingLoading(false);
            setTimeout(() => setFeedback(''), 1500);
        }
    };

    const currentRating = hoverRating > 0 ? hoverRating : userRating ?? 0;

    return (
        <div
            ref={wrapperRef}
            style={{ position: 'relative', zIndex: showPanel ? 50 : 'auto' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Standard card */}
            <Link href={href} className="movie-card">
                {posterUrl ? (
                    <img src={posterUrl} alt={title} loading="lazy" />
                ) : (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)',
                        padding: 'var(--space-md)', textAlign: 'center',
                    }}>
                        <Tv size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
                    </div>
                )}
                {averageRating && <div className="movie-card-rating">★ {averageRating}</div>}
                <div className="movie-card-overlay">
                    <div className="movie-card-title">{title}</div>
                    <div className="movie-card-year">{year}</div>
                </div>
            </Link>

            {/* Hover preview panel */}
            {showPanel && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        ...(side === 'right' ? { left: 'calc(100% + 10px)' } : { right: 'calc(100% + 10px)' }),
                        width: 280,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                        zIndex: 200,

                        pointerEvents: 'auto',

                        animation: 'fadeIn 0.15s ease',
                    }}
                >
                    {/* Backdrop */}
                    <div style={{ position: 'relative', height: 110, overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                        {(preview?.backdropUrl || posterUrl) && (
                            <img
                                src={preview?.backdropUrl || posterUrl!}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }}
                            />
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, var(--bg-secondary))' }} />
                    </div>

                    <div style={{ padding: '12px 16px 16px' }}>
                        {/* Title */}
                        <p style={{ fontWeight: 800, fontSize: 'var(--text-sm)', lineHeight: 1.3, marginBottom: 4 }}>{title}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>{year}</p>

                        {/* Average rating */}
                        {averageRating && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <span key={i} style={{ fontSize: 13, color: i <= Math.round(averageRating / 2) ? 'var(--star-filled)' : 'var(--border-default)' }}>★</span>
                                ))}
                                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{averageRating}/10</span>
                            </div>
                        )}

                        {/* Quick Rate (interactive) */}
                        {session && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase' }}>
                                    Quick Rate
                                </div>
                                <div 
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'auto' }}
                                    onMouseLeave={() => setHoverRating(0)}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
                                        const level: 0 | 0.5 | 1 = currentRating >= i ? 1 : currentRating >= i - 0.5 ? 0.5 : 0;
                                        return (
                                            <div
                                                key={i}
                                                onMouseMove={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoverRating(getHalfStepValue(e.clientX, rect, i));
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    handleRate(getHalfStepValue(e.clientX, rect, i));
                                                }}
                                                style={{
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: 2,
                                                    transition: 'opacity 0.1s ease',
                                                    opacity: isRatingLoading ? 0.6 : 1,
                                                }}
                                                title={`${formatTenthRating(getHalfStepValue(0, {left:0,width:20} as DOMRect, i))}/10`}
                                            >
                                                <StarFill level={level} size={16} />
                                            </div>
                                        );
                                    })}
                                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--star-filled)', minWidth: 28 }}>
                                        {formatTenthRating(currentRating)}/10
                                    </span>
                                </div>
                                {feedback && (
                                    <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 4, fontWeight: 600 }}>
                                        {feedback}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {preview?.description ? (
                            <p style={{
                                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12,
                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {preview.description}
                            </p>
                        ) : !preview ? (
                            <div style={{ height: 48, marginBottom: 12 }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <div className="skeleton" style={{ height: 12, borderRadius: 4, width: '85%' }} />
                                </div>
                            </div>
                        ) : null}

                        {/* Top cast */}
                        {preview?.cast?.slice(0, 3).map((c, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</span>
                                <span style={{ color: 'var(--text-tertiary)', maxWidth: '60%' }}>{c.character}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
