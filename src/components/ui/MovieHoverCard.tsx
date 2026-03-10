'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Film } from 'lucide-react';

interface MovieHoverCardProps {
    id: string;           // TMDB ID (used for the preview fetch)
    href: string;         // link target
    title: string;
    year: number;
    posterUrl: string | null;
    averageRating?: number | null;
    badge?: React.ReactNode;
}

interface PreviewData {
    cast: { name: string; character: string }[];
    backdropUrl: string | null;
    description: string | null;
}

// Module-level cache — persists across component re-renders
const cache = new Map<string, PreviewData>();

export default function MovieHoverCard({
    id, href, title, year, posterUrl, averageRating, badge,
}: MovieHoverCardProps) {
    const [showPanel, setShowPanel] = useState(false);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [side, setSide] = useState<'right' | 'left'>('right');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

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
    }, []);

    // Fetch preview data once the panel is visible
    useEffect(() => {
        if (!showPanel) return;
        if (cache.has(id)) { setPreview(cache.get(id)!); return; }
        let cancelled = false;
        fetch(`/api/movies/${id}/preview`)
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (!cancelled && data?.success) {
                    cache.set(id, data.data);
                    setPreview(data.data);
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [showPanel, id]);

    const stars = averageRating ? averageRating / 2 : null;

    return (
        <div
            ref={wrapperRef}
            style={{ position: 'relative', zIndex: showPanel ? 50 : 'auto' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* ── Standard card ──────────────────────────── */}
            <Link href={href} className="movie-card">
                {posterUrl ? (
                    <img src={posterUrl} alt={title} loading="lazy" />
                ) : (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)',
                        padding: 'var(--space-md)', textAlign: 'center',
                    }}>
                        <Film size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
                    </div>
                )}
                {averageRating && <div className="movie-card-rating">★ {averageRating}</div>}
                {badge}
                <div className="movie-card-overlay">
                    <div className="movie-card-title">{title}</div>
                    <div className="movie-card-year">{year}</div>
                </div>
            </Link>

            {/* ── Hover preview panel ─────────────────────── */}
            {showPanel && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        ...(side === 'right'
                            ? { left: 'calc(100% + 10px)' }
                            : { right: 'calc(100% + 10px)' }),
                        width: 262,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                        zIndex: 200,
                        pointerEvents: 'none',
                        animation: 'fadeIn 0.15s ease',
                    }}
                >
                    {/* Backdrop image */}
                    <div style={{ position: 'relative', height: 110, overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
                        {(preview?.backdropUrl || posterUrl) && (
                            <img
                                src={preview?.backdropUrl || posterUrl!}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }}
                            />
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, var(--bg-secondary))' }} />
                    </div>

                    <div style={{ padding: '8px 13px 13px' }}>
                        {/* Title + year */}
                        <p style={{ fontWeight: 800, fontSize: 'var(--text-sm)', lineHeight: 1.3, marginBottom: 2 }}>{title}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 7 }}>{year}</p>

                        {/* Star rating */}
                        {stars !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8 }}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <span key={i} style={{ fontSize: 11, color: i <= Math.round(stars) ? 'var(--star-filled)' : 'var(--border-default)' }}>★</span>
                                ))}
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 3 }}>{averageRating}/10</span>
                            </div>
                        )}

                        {/* Description */}
                        {preview?.description ? (
                            <p style={{
                                fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 10,
                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {preview.description}
                            </p>
                        ) : (
                            <div style={{ height: 44, marginBottom: 10 }}>
                                {!preview && (
                                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                        <div className="skeleton" style={{ height: 10, borderRadius: 4, width: '90%' }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Top cast */}
                        {preview?.cast && preview.cast.length > 0 ? (
                            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {preview.cast.map((c, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</span>
                                        <span style={{ color: 'var(--text-tertiary)', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.character}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            !preview && (
                                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[80, 65, 72].map((w, i) => (
                                        <div key={i} className="skeleton" style={{ height: 10, borderRadius: 4, width: `${w}%` }} />
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
