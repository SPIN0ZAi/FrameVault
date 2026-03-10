'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Tv, Star, Eye, MessageSquare, Activity, Users, AlertTriangle } from 'lucide-react';

interface ActivityEvent {
    id: string;
    type: 'watched' | 'rated' | 'reviewed' | 'watched_show' | 'rated_show';
    contentType: 'movie' | 'show';
    date: string;
    user: { id: string; username: string; avatarUrl: string | null };
    movie?: { id: string; tmdbId: number | null; title: string; year: number; posterUrl: string | null };
    show?: { tmdbShowId: number; title: string; year: number | null; posterUrl: string | null };
    rating?: number;
    reviewContent?: string;
    containsSpoilers?: boolean;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dayLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function StarMini({ value }: { value: number }) {
    const stars = Math.round((value / 10) * 5 * 2) / 2;
    return (
        <div style={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={11} fill={stars >= i ? 'currentColor' : 'none'} stroke="currentColor"
                    style={{ color: 'var(--star-filled)', opacity: stars >= i - 0.5 ? 1 : 0.25 }} />
            ))}
        </div>
    );
}

export default function ActivityPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [revealedReviews, setRevealedReviews] = useState<Set<string>>(new Set());
    const [activityTab, setActivityTab] = useState<'movies' | 'shows'>('movies');

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/login'); return; }
        if (status !== 'authenticated') return;
        fetch('/api/activity/feed')
            .then(r => r.json())
            .then(d => { if (d.success) setEvents(d.data); })
            .finally(() => setLoading(false));
    }, [status, router]);

    const visibleEvents = events.filter(ev =>
        activityTab === 'movies' ? ev.contentType === 'movie' : ev.contentType === 'show'
    );

    // Group visible events by day
    const grouped: { day: string; events: ActivityEvent[] }[] = [];
    for (const ev of visibleEvents) {
        const label = dayLabel(ev.date);
        const last = grouped[grouped.length - 1];
        if (last && last.day === label) {
            last.events.push(ev);
        } else {
            grouped.push({ day: label, events: [ev] });
        }
    }

    const movieCount = events.filter(e => e.contentType === 'movie').length;
    const showCount  = events.filter(e => e.contentType === 'show').length;

    if (status === 'loading' || loading) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 680 }}>
                    <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 'var(--space-xl)' }} />
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-sm)' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 680 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                    <Activity size={28} style={{ color: 'var(--brand)' }} />
                    <div>
                        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, lineHeight: 1 }}>Activity</h1>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 2 }}>What people you follow are watching</p>
                    </div>
                </div>

                {/* Films / TV Shows tab switcher */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', marginBottom: 'var(--space-xl)' }}>
                    {([
                        { key: 'movies' as const, label: 'Films',    icon: <Film size={14} />, count: movieCount },
                        { key: 'shows'  as const, label: 'TV Shows', icon: <Tv   size={14} />, count: showCount },
                    ]).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActivityTab(t.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '0.65rem 1.25rem',
                                fontSize: 'var(--text-sm)', fontWeight: 600,
                                color: activityTab === t.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                borderBottom: activityTab === t.key ? '2px solid var(--brand)' : '2px solid transparent',
                                marginBottom: '-1px', background: 'none', cursor: 'pointer',
                                transition: 'color 0.1s',
                            }}
                        >
                            {t.icon} {t.label}
                            {t.count > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 999, padding: '1px 6px' }}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {visibleEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
                        <Users size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto var(--space-md)' }} />
                        <p style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 'var(--space-sm)' }}>
                            {events.length === 0 ? 'No activity yet' : `No ${activityTab === 'movies' ? 'film' : 'TV show'} activity yet`}
                        </p>
                        <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-md)' }}>
                            {events.length === 0 ? 'Follow some members to see their activity here' : `People you follow haven\u2019t logged any ${activityTab === 'movies' ? 'films' : 'TV shows'} recently`}
                        </p>
                        {events.length === 0 && <Link href="/members" className="btn btn-primary btn-sm">Find Members</Link>}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
                        {grouped.map(group => (
                            <section key={group.day}>
                                {/* Day label */}
                                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--border-subtle)' }}>
                                    {group.day}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {group.events.map(ev => {
                                        const isShow = ev.contentType === 'show';
                                        const href = isShow
                                            ? `/shows/${ev.show!.tmdbShowId}`
                                            : `/movies/${ev.movie!.tmdbId ?? ev.movie!.id}`;
                                        const title      = isShow ? ev.show!.title      : ev.movie!.title;
                                        const year       = isShow ? ev.show!.year       : ev.movie!.year;
                                        const posterUrl  = isShow ? ev.show!.posterUrl  : ev.movie!.posterUrl;
                                        const isSpoiler = ev.type === 'reviewed' && ev.containsSpoilers && !revealedReviews.has(ev.id);
                                        return (
                                            <div key={ev.id} style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', alignItems: 'flex-start' }}>
                                                {/* Avatar */}
                                                <Link href={`/users/${ev.user.username}`} style={{ flexShrink: 0 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-tertiary)', border: '2px solid var(--border-default)' }}>
                                                        {ev.user.avatarUrl
                                                            ? <img src={ev.user.avatarUrl} alt={ev.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--text-tertiary)' }}>{ev.user.username.charAt(0).toUpperCase()}</div>
                                                        }
                                                    </div>
                                                </Link>

                                                {/* Body */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                                        <Link href={`/users/${ev.user.username}`} style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', textDecoration: 'none' }}>
                                                            {ev.user.username}
                                                        </Link>
                                                        {(ev.type === 'watched' || ev.type === 'watched_show') && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                                                <Eye size={11} /> watched
                                                            </span>
                                                        )}
                                                        {(ev.type === 'rated' || ev.type === 'rated_show') && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                                                <Star size={11} /> rated
                                                            </span>
                                                        )}
                                                        {ev.type === 'reviewed' && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                                                <MessageSquare size={11} /> reviewed
                                                            </span>
                                                        )}
                                                        <Link href={href} style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', textDecoration: 'none' }}>
                                                            {title}
                                                        </Link>
                                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{year}</span>
                                                        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(ev.date)}</span>
                                                    </div>

                                                    {(ev.type === 'rated' || ev.type === 'rated_show') && ev.rating != null && (
                                                        <StarMini value={ev.rating} />
                                                    )}

                                                    {ev.type === 'reviewed' && ev.reviewContent && (
                                                        isSpoiler ? (
                                                            <div className="spoiler-wrapper" style={{ marginTop: 4 }} onClick={() => setRevealedReviews(prev => new Set([...prev, ev.id]))}>
                                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
                                                                    {ev.reviewContent}
                                                                </p>
                                                                <div className="spoiler-overlay">
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 999, padding: '3px 10px', fontSize: 10, color: 'var(--warning)', fontWeight: 600 }}>
                                                                        <AlertTriangle size={10} /> Spoiler
                                                                    </span>
                                                                    <span style={{ fontSize: 10, color: 'var(--brand)', fontWeight: 600, background: 'rgba(0,209,193,0.1)', border: '1px solid rgba(0,209,193,0.25)', borderRadius: 999, padding: '3px 10px', cursor: 'pointer' }}>
                                                                        Tap to reveal
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
                                                                {ev.reviewContent}
                                                            </p>
                                                        )
                                                    )}
                                                </div>

                                                {/* Poster */}
                                                <Link href={href} style={{ flexShrink: 0 }}>
                                                    <div style={{ width: 64, height: 96, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-tertiary)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                                                        {posterUrl
                                                            ? <img src={posterUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {isShow ? <Tv size={20} style={{ opacity: 0.3 }} /> : <Film size={20} style={{ opacity: 0.3 }} />}
                                                              </div>
                                                        }
                                                    </div>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
