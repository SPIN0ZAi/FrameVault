'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Film, Tv, Star, MapPin, Calendar, BookmarkPlus, MessageSquare, Eye, Users, List, Globe, Lock, Crown, Search, X, Plus, GripVertical, Pencil, Trash2, Trophy, Shield, Sparkles, PenLine, BookOpen, BookMarked, Award, BarChart3, Gem, Heart, Flame, LayoutList, Archive, CheckCircle2, Sunrise, Clapperboard } from 'lucide-react';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, RARITY_COLORS, type AchievementDef, type AchievementRarity } from '@/lib/achievement-defs';

//  Types 

interface UserProfile {
    id: string;
    username: string;
    avatarUrl: string | null;
    role: string;
    createdAt: string;
    averageRating: number | null;
    isFollowing?: boolean;
    profile: {
        bio: string | null;
        location: string | null;
        bannerUrl: string | null;
        themeColor: string;
        bannerPosition: string | null;
        avatarPosition: string | null;
    } | null;
    _count: {
        watchedMovies: number;
        watchlist: number;
        reviews: number;
        ratings: number;
        followers: number;
        following: number;
        watchedShows: number;
        showWatchlist: number;
    };
}

interface WatchedMovie {
    id: string;
    watchedAt: string;
    movie: {
        id: string;
        tmdbId: number | null;
        title: string;
        year: number;
        posterUrl: string | null;
        customPosters?: { posterUrl: string }[];
    };
}

interface WatchedShow {
    id: string;
    tmdbShowId: number;
    title: string;
    year: number | null;
    posterUrl: string | null;
    watchedAt: string;
    rating?: number | null;
}

interface ShowWatchlistItem {
    id: string;
    tmdbShowId: number;
    title: string;
    year: number | null;
    posterUrl: string | null;
    addedAt: string;
}

interface Review {
    id: string;
    content: string;
    containsSpoilers: boolean;
    createdAt: string;
    rating: number | null;
    movie: { id: string; tmdbId: number | null; title: string; year: number; posterUrl: string | null };
}

interface WatchlistItem {
    id: string;
    addedAt: string;
    movie: { id: string; tmdbId: number | null; title: string; year: number; posterUrl: string | null; customPosters?: { posterUrl: string }[] };
}

interface NetworkUser {
    id: string;
    username: string;
    avatarUrl: string | null;
    isFollowing: boolean;
    _count: { watchedMovies: number };
}

interface UserList {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    updatedAt: string;
    _count: { movies: number };
}

interface Favorite {
    id: string;
    tmdbId: number;
    title: string;
    year: number | null;
    posterUrl: string | null;
    position: number;
}

interface TMDBSearchResult {
    tmdbId: number;
    title: string;
    year: number | null;
    posterUrl: string | null;
}

interface ShowFavorite {
    id: string;
    tmdbShowId: number;
    title: string;
    year: number | null;
    posterUrl: string | null;
    position: number;
}

interface TMDBShowSearchResult {
    tmdbShowId: number;
    title: string;
    year: number | null;
    posterUrl: string | null;
}

//  Helpers 

function MoviePosterCard({ href, posterUrl, title, year }: {
    href: string; posterUrl: string | null; title: string; year: number;
}) {
    return (
        <Link href={href} className="movie-card">
            {posterUrl ? (
                <img src={posterUrl} alt={title} loading="lazy" />
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center' }}>
                    <Film size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
                </div>
            )}
            <div className="movie-card-overlay">
                <div className="movie-card-title">{title}</div>
                <div className="movie-card-year">{year}</div>
            </div>
        </Link>
    );
}

function StarRating({ value, showNumber = false }: { value: number; showNumber?: boolean }) {
    const stars = Math.round((value / 10) * 5 * 2) / 2;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--star-filled)' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={15} fill={stars >= i ? 'currentColor' : 'none'} stroke="currentColor" style={{ opacity: stars >= i - 0.5 ? 1 : 0.25 }} />
            ))}
            {showNumber && <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, marginLeft: 2 }}>{value}/10</span>}
        </div>
    );
}

function RatingHistogramCard({ counts, average, total }: {
    counts: number[];
    average: number | null;
    total: number;
}) {
    if (total === 0) return null;
    const maxCount = Math.max(...counts, 1);
    const avgStars = average !== null ? +(average / 2).toFixed(2) : null;
    return (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-tertiary)' }}>RATINGS</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{total.toLocaleString()} {total === 1 ? 'RATING' : 'RATINGS'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: 56, gap: 3 }}>
                        {counts.map((count, i) => {
                            const h = Math.max(3, Math.round((count / maxCount) * 52));
                            return (
                                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                                    <div
                                        title={`${((i + 1) / 2).toFixed(1)}\u2605 (${i + 1}/10): ${count} rating${count !== 1 ? 's' : ''}`}
                                        style={{ width: '100%', height: h, background: 'rgba(255,255,255,0.13)', borderRadius: '2px 2px 0 0', cursor: 'default', transition: 'background 0.12s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, paddingTop: 5, borderTop: '1px solid var(--border-subtle)' }}>
                        <Star size={11} style={{ color: 'var(--star-filled)', opacity: 0.4 }} />
                        <div style={{ display: 'flex', gap: 1 }}>
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} fill="currentColor" style={{ color: 'var(--star-filled)', opacity: 0.7 }} />)}
                        </div>
                    </div>
                </div>
                {avgStars !== null && (
                    <div style={{ flexShrink: 0, textAlign: 'center', paddingBottom: 22 }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--star-filled)', lineHeight: 1 }}>{avgStars.toFixed(1)}</div>
                        <div style={{ display: 'flex', gap: 2, marginTop: 4, justifyContent: 'center' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={10} fill={avgStars >= i ? 'currentColor' : 'none'} stroke="currentColor"
                                    style={{ color: 'var(--star-filled)', opacity: avgStars >= i - 0.5 ? 1 : 0.3 }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Favorites ────────────────────────────────────────

function FavoriteSearchModal({ onSelect, onClose, existing }: {
    onSelect: (movie: TMDBSearchResult) => void;
    onClose: () => void;
    existing: number[];
}) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<TMDBSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);
    useEffect(() => {
        if (q.length < 2) { setResults([]); return; }
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/movies/tmdb-search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                if (data.success) setResults(data.data);
            } finally { setLoading(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [q]);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)' }} onClick={onClose}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-default)', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <input ref={inputRef} className="input" placeholder="Search for a film…" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none' }} />
                    <button onClick={onClose} style={{ color: 'var(--text-tertiary)', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {loading && <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Searching…</div>}
                    {!loading && q.length >= 2 && results.length === 0 && <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No results for &quot;{q}&quot;</div>}
                    {!loading && q.length < 2 && <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Type to search TMDB…</div>}
                    {results.map(r => {
                        const alreadyAdded = existing.includes(r.tmdbId);
                        return (
                            <button key={r.tmdbId} disabled={alreadyAdded}
                                onClick={() => { if (!alreadyAdded) { onSelect(r); onClose(); } }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'none', cursor: alreadyAdded ? 'default' : 'pointer', opacity: alreadyAdded ? 0.4 : 1, borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s', textAlign: 'left' }}
                                onMouseEnter={e => !alreadyAdded && ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}>
                                {r.posterUrl
                                    ? <img src={r.posterUrl} alt={r.title} style={{ width: 40, aspectRatio: '2/3', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                                    : <div style={{ width: 40, aspectRatio: '2/3', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={16} style={{ opacity: 0.4 }} /></div>
                                }
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{r.title}</p>
                                    {r.year && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{r.year}</p>}
                                </div>
                                {alreadyAdded && <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Added</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function FavoritesSection({ username, isOwnProfile, accent }: { username: string; isOwnProfile: boolean; accent: string }) {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<Favorite[]>([]);

    // Drag state
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
    const [ghostPoster, setGhostPoster] = useState<string | null>(null);
    const [ghostTitle, setGhostTitle] = useState('');
    const dragIdxRef = useRef<number | null>(null);
    const ghostOffsetRef = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`/api/users/${username}/favorites`)
            .then(r => r.json())
            .then(d => { if (d.success) setFavorites(d.data); })
            .finally(() => setLoading(false));
    }, [username]);

    const startEdit = () => { setDraft([...favorites]); setEditing(true); };
    const cancelEdit = () => { setDraft([]); setEditing(false); };

    const save = async () => {
        setSaving(true);
        try {
            // Send array directly — API expects a plain array
            const res = await fetch('/api/users/me/favorites', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    draft.map((f, i) => ({ tmdbId: f.tmdbId, title: f.title, year: f.year, posterUrl: f.posterUrl, position: i }))
                ),
            });
            const data = await res.json();
            if (data.success) { setFavorites(data.data); setEditing(false); setDraft([]); }
        } finally { setSaving(false); }
    };

    const addToFavorites = (movie: TMDBSearchResult) => {
        if (draft.length >= 5) return;
        setDraft(prev => [...prev, { id: '', tmdbId: movie.tmdbId, title: movie.title, year: movie.year, posterUrl: movie.posterUrl, position: prev.length }]);
    };

    const removeFavorite = (idx: number) => { setDraft(prev => prev.filter((_, i) => i !== idx)); };

    // ── Pointer-based drag ──────────────────────────────────────────────
    const startDrag = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
        if (!editing) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        ghostOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        dragIdxRef.current = idx;
        setDragIdx(idx);
        setGhostPos({ x: e.clientX, y: e.clientY });
        setGhostPoster(draft[idx]?.posterUrl ?? null);
        setGhostTitle(draft[idx]?.title ?? '');

        const onMove = (me: PointerEvent) => {
            setGhostPos({ x: me.clientX, y: me.clientY });

            if (!containerRef.current || dragIdxRef.current === null) return;
            const cards = containerRef.current.querySelectorAll<HTMLElement>('[data-fav-idx]');
            let hovered: number | null = null;
            cards.forEach(card => {
                const r = card.getBoundingClientRect();
                if (me.clientX >= r.left && me.clientX <= r.right && me.clientY >= r.top - 30 && me.clientY <= r.bottom + 30) {
                    hovered = parseInt(card.dataset.favIdx!);
                }
            });
            if (hovered !== null && hovered !== dragIdxRef.current) {
                const from = dragIdxRef.current;
                const to = hovered;
                dragIdxRef.current = to;
                setDragIdx(to);
                setDraft(prev => {
                    const next = [...prev];
                    const [moved] = next.splice(from, 1);
                    next.splice(to, 0, moved);
                    return next;
                });
            }
        };

        const onUp = () => {
            setDragIdx(null);
            setGhostPos(null);
            setGhostPoster(null);
            setGhostTitle('');
            dragIdxRef.current = null;
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const list = editing ? draft : favorites;

    if (loading) return <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />;
    if (!isOwnProfile && favorites.length === 0) return null;

    return (
        <section style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 'var(--space-md)', gap: 'var(--space-md)' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Crown size={18} style={{ color: '#fbbf24' }} /> Top 5 Favorites
                </h2>
                {isOwnProfile && !editing && (
                    <button onClick={startEdit} className="btn btn-ghost btn-sm">Edit</button>
                )}
                {editing && (
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button onClick={cancelEdit} className="btn btn-ghost btn-sm">Cancel</button>
                        <button onClick={save} disabled={saving} className="btn btn-primary btn-sm"
                            style={{ background: accent, borderColor: accent }}>
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                )}
            </div>

            {/* Ghost image that follows the cursor */}
            {ghostPos && (
                <div style={{
                    position: 'fixed',
                    left: ghostPos.x - ghostOffsetRef.current.x,
                    top: ghostPos.y - ghostOffsetRef.current.y,
                    width: 125,
                    aspectRatio: '2/3',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    transform: 'rotate(4deg) scale(1.08)',
                    transformOrigin: `${ghostOffsetRef.current.x}px ${ghostOffsetRef.current.y}px`,
                    boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: `2px solid ${accent}`,
                }}>
                    {ghostPoster
                        ? <img src={ghostPoster} alt={ghostTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Film size={24} style={{ opacity: 0.4 }} />
                        </div>
                    }
                </div>
            )}

            <div ref={containerRef} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', justifyContent: 'center', paddingBottom: 4, paddingTop: 12, userSelect: 'none', flexWrap: 'wrap' }}>
                {list.map((fav, idx) => {
                    const isDragged = editing && dragIdx === idx;
                    return (
                        <div
                            key={fav.tmdbId}
                            data-fav-idx={idx}
                            onPointerDown={e => startDrag(e, idx)}
                            style={{
                                flexShrink: 0,
                                width: 125,
                                position: 'relative',
                                cursor: editing ? (dragIdx !== null ? 'grabbing' : 'grab') : 'default',
                                opacity: isDragged ? 0.25 : 1,
                                transform: isDragged ? 'scale(0.95)' : 'scale(1)',
                                transition: 'opacity 0.12s, transform 0.12s',
                                touchAction: 'none',
                            }}>
                            <Link href={`/movies/${fav.tmdbId}`} onClick={e => editing && e.preventDefault()}>
                                <div style={{ position: 'relative' }}>
                                    {fav.posterUrl
                                        ? <img
                                            src={fav.posterUrl}
                                            alt={fav.title}
                                            draggable={false}
                                            style={{
                                                width: 125,
                                                aspectRatio: '2/3',
                                                objectFit: 'cover',
                                                borderRadius: 'var(--radius-md)',
                                                display: 'block',
                                                boxShadow: idx === 0 && !isDragged
                                                    ? '0 0 20px rgba(251,191,36,0.5), 0 0 0 2px rgba(251,191,36,0.6)'
                                                    : '0 4px 12px rgba(0,0,0,0.3)',
                                                transition: 'box-shadow 0.2s',
                                            }}
                                        />
                                        : <div style={{ width: 125, aspectRatio: '2/3', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Film size={24} style={{ opacity: 0.4 }} />
                                        </div>
                                    }
                                    {idx === 0 && !isDragged && (
                                        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 20, lineHeight: 1 }}>👑</div>
                                    )}
                                    {editing && (
                                        <div style={{
                                            position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
                                            background: isDragged ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'background 0.12s',
                                        }}>
                                            <GripVertical size={20} style={{ color: '#fff', opacity: 0.9 }} />
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                {fav.title}
                            </p>
                            {editing && (
                                <button
                                    onClick={() => removeFavorite(idx)}
                                    style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: '2px solid var(--bg-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                    <X size={10} style={{ color: '#fff' }} />
                                </button>
                            )}
                        </div>
                    );
                })}

                {editing && draft.length < 5 && (
                    <button
                        onClick={() => setShowModal(true)}
                        style={{ flexShrink: 0, width: 125, aspectRatio: '2/3', borderRadius: 'var(--radius-md)', border: `2px dashed ${accent}66`, background: `${accent}11`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: accent, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${accent}22`)}
                        onMouseLeave={e => (e.currentTarget.style.background = `${accent}11`)}
                    >
                        <Plus size={20} />
                        <span style={{ fontSize: 10, fontWeight: 600 }}>Add film</span>
                    </button>
                )}

                {!editing && list.length === 0 && isOwnProfile && (
                    <button
                        onClick={startEdit}
                        style={{ flexShrink: 0, width: 100, aspectRatio: '2/3', borderRadius: 'var(--radius-md)', border: `2px dashed ${accent}44`, background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
                        <Crown size={20} style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: 10 }}>Pick favorites</span>
                    </button>
                )}
            </div>

            {showModal && (
                <FavoriteSearchModal onSelect={addToFavorites} onClose={() => setShowModal(false)} existing={draft.map(f => f.tmdbId)} />
            )}
        </section>
    );
}

// ─── Show Favorites (Top 5 Series) ───────────────────

function ShowFavoriteSearchModal({ onSelect, onClose, existing }: {
    onSelect: (show: TMDBShowSearchResult) => void;
    onClose: () => void;
    existing: number[];
}) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<TMDBShowSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);
    useEffect(() => {
        if (q.length < 2) { setResults([]); return; }
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/shows/tmdb-search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                if (data.success) setResults(data.data);
            } finally { setLoading(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [q]);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)' }} onClick={onClose}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-default)', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <input ref={inputRef} className="input" placeholder="Search for a series…" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none' }} />
                    <button onClick={onClose} style={{ color: 'var(--text-tertiary)', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {loading && <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Searching…</div>}
                    {!loading && q.length >= 2 && results.length === 0 && <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No results for &quot;{q}&quot;</div>}
                    {!loading && q.length < 2 && <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Type to search TMDB…</div>}
                    {results.map(r => {
                        const alreadyAdded = existing.includes(r.tmdbShowId);
                        return (
                            <button key={r.tmdbShowId} disabled={alreadyAdded}
                                onClick={() => { if (!alreadyAdded) { onSelect(r); onClose(); } }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'none', cursor: alreadyAdded ? 'default' : 'pointer', opacity: alreadyAdded ? 0.4 : 1, borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s', textAlign: 'left' }}
                                onMouseEnter={e => !alreadyAdded && ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}>
                                {r.posterUrl
                                    ? <img src={r.posterUrl} alt={r.title} style={{ width: 40, aspectRatio: '2/3', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                                    : <div style={{ width: 40, aspectRatio: '2/3', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tv size={16} style={{ opacity: 0.4 }} /></div>
                                }
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{r.title}</p>
                                    {r.year && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{r.year}</p>}
                                </div>
                                {alreadyAdded && <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Added</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function TopSeriesSection({ username, isOwnProfile, accent }: { username: string; isOwnProfile: boolean; accent: string }) {
    const [showFavorites, setShowFavorites] = useState<ShowFavorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<ShowFavorite[]>([]);

    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
    const [ghostPoster, setGhostPoster] = useState<string | null>(null);
    const [ghostTitle, setGhostTitle] = useState('');
    const dragIdxRef = useRef<number | null>(null);
    const ghostOffsetRef = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`/api/users/${username}/show-favorites`)
            .then(r => r.json())
            .then(d => { if (d.success) setShowFavorites(d.data); })
            .finally(() => setLoading(false));
    }, [username]);

    const startEdit = () => { setDraft([...showFavorites]); setEditing(true); };
    const cancelEdit = () => { setDraft([]); setEditing(false); };

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/users/me/show-favorites', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    draft.map((f, i) => ({ tmdbShowId: f.tmdbShowId, title: f.title, year: f.year, posterUrl: f.posterUrl, position: i }))
                ),
            });
            const data = await res.json();
            if (data.success) { setShowFavorites(data.data); setEditing(false); setDraft([]); }
        } finally { setSaving(false); }
    };

    const addToFavorites = (show: TMDBShowSearchResult) => {
        if (draft.length >= 5) return;
        setDraft(prev => [...prev, { id: '', tmdbShowId: show.tmdbShowId, title: show.title, year: show.year, posterUrl: show.posterUrl, position: prev.length }]);
    };

    const removeFavorite = (idx: number) => { setDraft(prev => prev.filter((_, i) => i !== idx)); };

    const startDrag = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
        if (!editing) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        ghostOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        dragIdxRef.current = idx;
        setDragIdx(idx);
        setGhostPos({ x: e.clientX, y: e.clientY });
        setGhostPoster(draft[idx]?.posterUrl ?? null);
        setGhostTitle(draft[idx]?.title ?? '');

        const onMove = (me: PointerEvent) => {
            setGhostPos({ x: me.clientX, y: me.clientY });
            if (!containerRef.current || dragIdxRef.current === null) return;
            const cards = containerRef.current.querySelectorAll<HTMLElement>('[data-sfav-idx]');
            let hovered: number | null = null;
            cards.forEach(card => {
                const r = card.getBoundingClientRect();
                if (me.clientX >= r.left && me.clientX <= r.right && me.clientY >= r.top - 30 && me.clientY <= r.bottom + 30) {
                    hovered = parseInt(card.dataset.sfavIdx!);
                }
            });
            if (hovered !== null && hovered !== dragIdxRef.current) {
                const from = dragIdxRef.current;
                const to = hovered;
                dragIdxRef.current = to;
                setDragIdx(to);
                setDraft(prev => {
                    const next = [...prev];
                    const [moved] = next.splice(from, 1);
                    next.splice(to, 0, moved);
                    return next;
                });
            }
        };

        const onUp = () => {
            setDragIdx(null); setGhostPos(null); setGhostPoster(null); setGhostTitle('');
            dragIdxRef.current = null;
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const list = editing ? draft : showFavorites;

    if (loading) return <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)', marginTop: 'var(--space-xl)' }} />;
    if (!isOwnProfile && showFavorites.length === 0) return null;

    return (
        <section style={{ width: '100%', marginTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 'var(--space-md)', gap: 'var(--space-md)' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tv size={18} style={{ color: accent }} /> Top 5 Series
                </h2>
                {isOwnProfile && !editing && (
                    <button onClick={startEdit} className="btn btn-ghost btn-sm">Edit</button>
                )}
                {editing && (
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button onClick={cancelEdit} className="btn btn-ghost btn-sm">Cancel</button>
                        <button onClick={save} disabled={saving} className="btn btn-primary btn-sm"
                            style={{ background: accent, borderColor: accent }}>
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                )}
            </div>

            {ghostPos && (
                <div style={{
                    position: 'fixed',
                    left: ghostPos.x - ghostOffsetRef.current.x,
                    top: ghostPos.y - ghostOffsetRef.current.y,
                    width: 125, aspectRatio: '2/3', zIndex: 9999, pointerEvents: 'none',
                    transform: 'rotate(4deg) scale(1.08)',
                    transformOrigin: `${ghostOffsetRef.current.x}px ${ghostOffsetRef.current.y}px`,
                    boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                    borderRadius: 'var(--radius-md)', overflow: 'hidden',
                    border: `2px solid ${accent}`,
                }}>
                    {ghostPoster
                        ? <img src={ghostPoster} alt={ghostTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Tv size={24} style={{ opacity: 0.4 }} />
                        </div>
                    }
                </div>
            )}

            <div ref={containerRef} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', justifyContent: 'center', paddingBottom: 4, paddingTop: 12, userSelect: 'none', flexWrap: 'wrap' }}>
                {list.map((fav, idx) => {
                    const isDragged = editing && dragIdx === idx;
                    return (
                        <div
                            key={fav.tmdbShowId}
                            data-sfav-idx={idx}
                            onPointerDown={e => startDrag(e, idx)}
                            style={{
                                flexShrink: 0, width: 125, position: 'relative',
                                cursor: editing ? (dragIdx !== null ? 'grabbing' : 'grab') : 'default',
                                opacity: isDragged ? 0.25 : 1,
                                transform: isDragged ? 'scale(0.95)' : 'scale(1)',
                                transition: 'opacity 0.12s, transform 0.12s',
                                touchAction: 'none',
                            }}>
                            <Link href={`/shows/${fav.tmdbShowId}`} onClick={e => editing && e.preventDefault()}>
                                <div style={{ position: 'relative' }}>
                                    {fav.posterUrl
                                        ? <img
                                            src={fav.posterUrl}
                                            alt={fav.title}
                                            draggable={false}
                                            style={{
                                                width: 125, aspectRatio: '2/3', objectFit: 'cover',
                                                borderRadius: 'var(--radius-md)', display: 'block',
                                                boxShadow: idx === 0 && !isDragged
                                                    ? `0 0 20px ${accent}80, 0 0 0 2px ${accent}99`
                                                    : '0 4px 12px rgba(0,0,0,0.3)',
                                                transition: 'box-shadow 0.2s',
                                            }}
                                        />
                                        : <div style={{ width: 125, aspectRatio: '2/3', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Tv size={24} style={{ opacity: 0.4 }} />
                                        </div>
                                    }
                                    {idx === 0 && !isDragged && (
                                        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 20, lineHeight: 1 }}>👑</div>
                                    )}
                                    {editing && (
                                        <div style={{
                                            position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
                                            background: isDragged ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'background 0.12s',
                                        }}>
                                            <GripVertical size={20} style={{ color: '#fff', opacity: 0.9 }} />
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                {fav.title}
                            </p>
                            {editing && (
                                <button
                                    onClick={() => removeFavorite(idx)}
                                    style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: '2px solid var(--bg-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                    <X size={10} style={{ color: '#fff' }} />
                                </button>
                            )}
                        </div>
                    );
                })}

                {editing && draft.length < 5 && (
                    <button
                        onClick={() => setShowModal(true)}
                        style={{ flexShrink: 0, width: 125, aspectRatio: '2/3', borderRadius: 'var(--radius-md)', border: `2px dashed ${accent}66`, background: `${accent}11`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: accent, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${accent}22`)}
                        onMouseLeave={e => (e.currentTarget.style.background = `${accent}11`)}
                    >
                        <Plus size={20} />
                        <span style={{ fontSize: 10, fontWeight: 600 }}>Add series</span>
                    </button>
                )}

                {!editing && list.length === 0 && isOwnProfile && (
                    <button
                        onClick={startEdit}
                        style={{ flexShrink: 0, width: 100, aspectRatio: '2/3', borderRadius: 'var(--radius-md)', border: `2px dashed ${accent}44`, background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
                        <Tv size={20} style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: 10 }}>Pick series</span>
                    </button>
                )}
            </div>

            {showModal && (
                <ShowFavoriteSearchModal onSelect={addToFavorites} onClose={() => setShowModal(false)} existing={draft.map(f => f.tmdbShowId)} />
            )}
        </section>
    );
}

// ─────────────────────────────────────────────────────

function EmptyTab({ icon, text, cta }: { icon: React.ReactNode; text: string; cta?: { label: string; href: string } }) {    return (
        <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
            <div style={{ margin: '0 auto var(--space-md)', opacity: 0.3 }}>{icon}</div>
            <p style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{text}</p>
            {cta && <Link href={cta.href} className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)', display: 'inline-flex' }}>{cta.label}</Link>}
        </div>
    );
}

function ReviewCard({
    review, revealed, onReveal, isOwn, onUpdate, onDelete,
}: {
    review: Review; revealed: boolean; onReveal: () => void;
    isOwn?: boolean;
    onUpdate?: (updated: Review) => void;
    onDelete?: (id: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(review.content);
    const [editSpoiler, setEditSpoiler] = useState(review.containsSpoilers);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const href = `/movies/${review.movie.tmdbId ?? review.movie.id}`;

    const handleSaveEdit = async () => {
        if (editText.trim().length < 10) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/reviews/${review.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editText.trim(), containsSpoilers: editSpoiler }),
            });
            const data = await res.json();
            if (data.success) {
                onUpdate?.({ ...review, content: editText.trim(), containsSpoilers: editSpoiler });
                setEditing(false);
            }
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/reviews/${review.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) onDelete?.(review.id);
        } finally { setDeleting(false); setConfirmDelete(false); }
    };

    return (
        <div style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <Link href={href} style={{ flexShrink: 0, width: '64px' }} onClick={e => editing && e.preventDefault()}>
                {review.movie.posterUrl ? (
                    <img src={review.movie.posterUrl} alt={review.movie.title} style={{ width: '64px', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                ) : (
                    <div style={{ width: '64px', aspectRatio: '2/3', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Film size={20} style={{ opacity: 0.4 }} />
                    </div>
                )}
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                    <div>
                        <Link href={href} style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{review.movie.title}</Link>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginLeft: '6px' }}>{review.movie.year}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {isOwn && !editing && (
                            <>
                                <button
                                    onClick={() => { setEditText(review.content); setEditSpoiler(review.containsSpoilers); setEditing(true); setConfirmDelete(false); }}
                                    title="Edit review"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, display: 'flex', alignItems: 'center', borderRadius: 4, transition: 'color 0.12s' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                                ><Pencil size={14} /></button>
                                {!confirmDelete
                                    ? <button
                                        onClick={() => setConfirmDelete(true)}
                                        title="Delete review"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, display: 'flex', alignItems: 'center', borderRadius: 4, transition: 'color 0.12s' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                                    ><Trash2 size={14} /></button>
                                    : <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>Delete?</span>
                                        <button onClick={handleDelete} disabled={deleting}
                                            style={{ background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>
                                            {deleting ? '…' : 'Yes'}
                                        </button>
                                        <button onClick={() => setConfirmDelete(false)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px 4px', fontSize: 11 }}>No</button>
                                    </div>
                                }
                            </>
                        )}
                    </div>
                </div>

                {/* Stars + numeric rating */}
                {review.rating != null && review.rating > 0 && (
                    <div style={{ marginBottom: 'var(--space-sm)' }}>
                        <StarRating value={review.rating} showNumber />
                    </div>
                )}

                {/* Content or inline edit form */}
                {editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
                        <textarea
                            className="input"
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            autoFocus
                            style={{ width: '100%', minHeight: 100, resize: 'vertical', fontSize: 'var(--text-sm)' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={editSpoiler} onChange={e => setEditSpoiler(e.target.checked)} />
                                Contains spoilers
                            </label>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-sm)' }}>
                                <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">Cancel</button>
                                <button onClick={handleSaveEdit} disabled={saving || editText.trim().length < 10} className="btn btn-primary btn-sm">
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : review.containsSpoilers && !revealed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)' }}>Contains spoilers</span>
                        <button onClick={onReveal} style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', fontWeight: 600, background: 'none', cursor: 'pointer' }}>Reveal</button>
                    </div>
                ) : (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as const }}>
                        {review.content}
                    </p>
                )}
            </div>
        </div>
    );
}

function NetworkList({ users, emptyText, currentUserId }: { users: NetworkUser[]; emptyText: string; currentUserId?: string }) {
    const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

    const toggle = async (targetUsername: string, userId: string, currentlyFollowing: boolean) => {
        if (!currentUserId) return;
        setFollowStates(prev => ({ ...prev, [userId]: !currentlyFollowing }));
        try {
            await fetch(`/api/users/${targetUsername}/follow`, { method: currentlyFollowing ? 'DELETE' : 'POST' });
        } catch {
            setFollowStates(prev => ({ ...prev, [userId]: currentlyFollowing }));
        }
    };

    if (users.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
                <Users size={48} style={{ margin: '0 auto var(--space-md)', opacity: 0.3 }} />
                <p style={{ fontWeight: 600 }}>{emptyText}</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {users.map(u => {
                const following = followStates[u.id] !== undefined ? followStates[u.id] : u.isFollowing;
                const isSelf = currentUserId === u.id;
                return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                        <Link href={`/users/${u.username}`}>
                            {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={u.username} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--text-base)' }}>
                                    {u.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Link>
                        <div style={{ flex: 1 }}>
                            <Link href={`/users/${u.username}`} style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{u.username}</Link>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{u._count.watchedMovies} films watched</span>
                        </div>
                        {currentUserId && !isSelf && (
                            <button onClick={() => toggle(u.username, u.id, following)} className={`btn btn-sm ${following ? 'btn-ghost' : 'btn-primary'}`}>
                                {following ? 'Following' : 'Follow'}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function RecentReviewsPreview({ username, onViewAll }: { username: string; onViewAll: () => void }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [revealed, setRevealed] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetch(`/api/users/${username}/reviews?limit=3`)
            .then(r => r.json())
            .then(d => { if (d.success) setReviews(d.data); setLoaded(true); });
    }, [username]);

    if (!loaded) return <div className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }} />;
    if (reviews.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {reviews.map(r => (
                <ReviewCard key={r.id} review={r} revealed={revealed.has(r.id)} onReveal={() => setRevealed(prev => new Set([...prev, r.id]))} />
            ))}
            <button onClick={onViewAll} style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 600, background: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 'var(--space-xs)' }}>
                See all reviews
            </button>
        </div>
    );
}

// ─── Achievement icon lookup ──────────────────────────────────────────────────
const ACHIEVEMENT_ICON_MAP = {
    Film, Trophy, Shield, Sparkles, Crown, PenLine, BookOpen, BookMarked, Award,
    Star, BarChart3, Gem, Users, Heart, Flame, LayoutList, Archive, CheckCircle2,
    Sunrise, Clapperboard,
} as const;
type AchievementIconKey = keyof typeof ACHIEVEMENT_ICON_MAP;

//  Main Page 

export default function UserProfilePage() {
    const { username } = useParams<{ username: string }>();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<'not_found' | 'server_error' | null>(null);
    const [activeTab, setActiveTab] = useState<'Profile' | 'Films' | 'TV' | 'Reviews' | 'Watchlist' | 'Lists' | 'Network' | 'Achievements'>(() => {
        const tab = searchParams.get('tab');
        const valid = ['Profile', 'Films', 'TV', 'Reviews', 'Watchlist', 'Lists', 'Network', 'Achievements'];
        return (valid.includes(tab ?? '') ? tab : 'Profile') as 'Profile' | 'Films' | 'TV' | 'Reviews' | 'Watchlist' | 'Lists' | 'Network' | 'Achievements';
    });
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
    const [allFilms, setAllFilms] = useState<WatchedMovie[]>([]);
    const [allFilmsLoaded, setAllFilmsLoaded] = useState(false);
    const [filmsPage, setFilmsPage] = useState(1);
    const [filmsTotalPages, setFilmsTotalPages] = useState(1);
    const [filmsTotalCount, setFilmsTotalCount] = useState(0);
    const [filmsSort, setFilmsSort] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'rating_desc'>('date_desc');
    const [filmsRatingFilter, setFilmsRatingFilter] = useState<number | null>(null);
    // ── TV Shows state ──────────────────────────────────────────────────────
    const [watchedShows, setWatchedShows] = useState<WatchedShow[]>([]);
    const [allShows, setAllShows] = useState<WatchedShow[]>([]);
    const [allShowsLoaded, setAllShowsLoaded] = useState(false);
    const [showsPage, setShowsPage] = useState(1);
    const [showsTotalPages, setShowsTotalPages] = useState(1);
    const [showsTotalCount, setShowsTotalCount] = useState(0);
    const [showsSort, setShowsSort] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'rating_desc'>('date_desc');
    const [showsRatingFilter, setShowsRatingFilter] = useState<number | null>(null);
    const [showWatchlist, setShowWatchlist] = useState<ShowWatchlistItem[]>([]);
    const [showWatchlistLoaded, setShowWatchlistLoaded] = useState(false);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoaded, setReviewsLoaded] = useState(false);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [watchlistLoaded, setWatchlistLoaded] = useState(false);
    const [watchlistSubTab, setWatchlistSubTab] = useState<'movies' | 'shows'>('movies');
    const [network, setNetwork] = useState<{ followers: NetworkUser[]; following: NetworkUser[] } | null>(null);
    const [networkLoaded, setNetworkLoaded] = useState(false);
    const [networkTab, setNetworkTab] = useState<'followers' | 'following'>('followers');
    const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
    const [userLists, setUserLists] = useState<UserList[]>([]);
    const [listsLoaded, setListsLoaded] = useState(false);
    const [userRatingHistogram, setUserRatingHistogram] = useState<{ counts: number[]; average: number | null; total: number } | null>(null);

    // ── Achievements state ──────────────────────────────────────────────────
    type EarnedMap = Record<string, { earnedAt: string }>;
    const [earnedMap, setEarnedMap] = useState<EarnedMap>({});
    const [earnedCount, setEarnedCount] = useState(0);
    const [achievementsLoaded, setAchievementsLoaded] = useState(false);
    const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null);

    // ── Oscar vote state ────────────────────────────────────────────────────
    type PollNominee = { title: string; year: number; posterUrl: string | null };
    type VoteResult = { movieTitle: string; votes: number; pct: number };
    type PollData = {
        poll: { id: string; year: number; nominees: PollNominee[]; isOpen: boolean } | null;
        userVote: { movieTitle: string } | null;
        results: VoteResult[] | null;
        totalVotes: number;
    };
    const [pollData, setPollData] = useState<PollData | null>(null);
    const [pollLoaded, setPollLoaded] = useState(false);
    const [votingFor, setVotingFor] = useState<string | null>(null);
    const [voteLoading, setVoteLoading] = useState(false);

    const isOwnProfile = session?.user?.username === username;
    const TABS = ['Profile', 'Films', 'TV', 'Reviews', 'Watchlist', 'Lists', 'Network', 'Achievements'] as const;
    const accent = user?.profile?.themeColor || 'var(--brand)';
    const switchTab = (tab: typeof TABS[number]) => {
        setActiveTab(tab);
        const p = new URLSearchParams(searchParams.toString());
        if (tab === 'Profile') { p.delete('tab'); } else { p.set('tab', tab); }
        const qs = p.toString();
        router.replace(`/users/${username}${qs ? `?${qs}` : ''}`, { scroll: false });
    };

    useEffect(() => {
        async function fetchProfile() {
            try {
                const [userRes, watchedRes, histRes, showsRes] = await Promise.all([
                    fetch(`/api/users/${username}`),
                    fetch(`/api/users/${username}/watched?limit=8`),
                    fetch(`/api/users/${username}/rating-histogram`),
                    fetch(`/api/users/${username}/shows?limit=8`),
                ]);
                const userData = await userRes.json();
                const watchedData = await watchedRes.json();
                const histData = await histRes.json();
                const showsData = await showsRes.json();
                if (userData.success) {
                    setUser(userData.data);
                    setIsFollowing(userData.data.isFollowing || false);
                } else if (userRes.status === 404) {
                    setError('not_found');
                } else {
                    setError('server_error');
                }
                if (watchedData.success) setWatchedMovies(watchedData.data);
                if (histData.success) setUserRatingHistogram(histData.data);
                if (showsData.success) setWatchedShows(showsData.data);
            } catch {
                setError('server_error');
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [username]);

    useEffect(() => {
        if (activeTab === 'Films') {
            setAllFilmsLoaded(false);
            const params = new URLSearchParams({ limit: '50', page: filmsPage.toString(), sort: filmsSort });
            if (filmsRatingFilter) params.set('minRating', filmsRatingFilter.toString());
            fetch(`/api/users/${username}/watched?${params}`)
                .then(r => r.json())
                .then(d => {
                    if (d.success) {
                        setAllFilms(d.data);
                        setFilmsTotalPages(d.meta?.totalPages ?? 1);
                        setFilmsTotalCount(d.meta?.totalCount ?? 0);
                    }
                    setAllFilmsLoaded(true);
                });
        }
        if (activeTab === 'TV') {
            setAllShowsLoaded(false);
            const params = new URLSearchParams({ limit: '50', page: showsPage.toString(), sort: showsSort });
            if (showsRatingFilter) params.set('minRating', showsRatingFilter.toString());
            fetch(`/api/users/${username}/shows?${params}`)
                .then(r => r.json())
                .then(d => {
                    if (d.success) {
                        setAllShows(d.data);
                        setShowsTotalPages(d.meta?.totalPages ?? 1);
                        setShowsTotalCount(d.meta?.totalCount ?? 0);
                    }
                    setAllShowsLoaded(true);
                });
            if (!showWatchlistLoaded) {
                fetch(`/api/users/${username}/show-watchlist?limit=200`)
                    .then(r => r.json())
                    .then(d => { if (d.success) setShowWatchlist(d.data); setShowWatchlistLoaded(true); });
            }
        }
        if (activeTab === 'Reviews' && !reviewsLoaded) {
            fetch(`/api/users/${username}/reviews?limit=50`)
                .then(r => r.json())
                .then(d => { if (d.success) setReviews(d.data); setReviewsLoaded(true); });
        }
        if (activeTab === 'Watchlist' && !watchlistLoaded) {
            fetch(`/api/users/${username}/watchlist?limit=200`)
                .then(r => r.json())
                .then(d => { if (d.success) setWatchlist(d.data); setWatchlistLoaded(true); });
        }
        if (activeTab === 'Watchlist' && !showWatchlistLoaded) {
            fetch(`/api/users/${username}/show-watchlist?limit=200`)
                .then(r => r.json())
                .then(d => { if (d.success) setShowWatchlist(d.data); setShowWatchlistLoaded(true); });
        }
        if (activeTab === 'Network' && !networkLoaded) {
            fetch(`/api/users/${username}/network`)
                .then(r => r.json())
                .then(d => { if (d.success) setNetwork(d.data); setNetworkLoaded(true); });
        }
        if (activeTab === 'Lists' && !listsLoaded) {
            fetch(`/api/users/${username}/lists`)
                .then(r => r.json())
                .then(d => { if (d.success) setUserLists(d.data); setListsLoaded(true); });
        }
        if (activeTab === 'Achievements' && !achievementsLoaded) {
            fetch(`/api/users/${username}/achievements`)
                .then(r => r.json())
                .then(d => {
                    if (d.success) {
                        const map: Record<string, { earnedAt: string }> = {};
                        for (const a of d.data.achievements) {
                            if (a.earned) map[a.id] = a.earned;
                        }
                        setEarnedMap(map);
                        setEarnedCount(d.data.earnedCount);
                    }
                    setAchievementsLoaded(true);
                });
            if (!pollLoaded) {
                fetch('/api/votes')
                    .then(r => r.json())
                    .then(d => { if (d.success) setPollData(d.data); setPollLoaded(true); });
            }
        }
    }, [activeTab, username, filmsPage, filmsSort, filmsRatingFilter, showsPage, showsSort, showsRatingFilter, showWatchlistLoaded, reviewsLoaded, watchlistLoaded, networkLoaded, achievementsLoaded, pollLoaded]);

    const handleFollowToggle = async () => {
        if (!user || !session) return;
        setFollowLoading(true);
        try {
            const method = isFollowing ? 'DELETE' : 'POST';
            const res = await fetch(`/api/users/${user.username}/follow`, { method });
            const data = await res.json();
            if (data.success) {
                setIsFollowing(prev => !prev);
                setUser(prev => prev ? {
                    ...prev,
                    _count: { ...prev._count, followers: isFollowing ? prev._count.followers - 1 : prev._count.followers + 1 },
                } : null);
            }
        } finally {
            setFollowLoading(false);
        }
    };

    const handleVoteSelect = (title: string) => setVotingFor(prev => prev === title ? null : title);

    const handleVoteSubmit = async () => {
        if (!votingFor || voteLoading) return;
        setVoteLoading(true);
        try {
            const res = await fetch('/api/votes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movieTitle: votingFor }),
            });
            const data = await res.json();
            if (data.success) {
                setPollData(prev => prev ? {
                    ...prev,
                    userVote: { movieTitle: votingFor },
                    results: data.data.results,
                    totalVotes: data.data.totalVotes,
                } : null);
                setVotingFor(null);
                // Refresh achievements since oscar_voter_2026 may now be earned
                setAchievementsLoaded(false);
            }
        } finally {
            setVoteLoading(false);
        }
    };

    if (loading) {
        return (
            <div>
                <div className="skeleton" style={{ height: '280px' }} />
                <div className="container" style={{ marginTop: '-60px' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-end' }}>
                        <div className="skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%', flexShrink: 0, border: '4px solid var(--bg-primary)' }} />
                        <div style={{ flex: 1, paddingBottom: '8px' }}>
                            <div className="skeleton" style={{ height: '28px', width: '180px', marginBottom: '8px' }} />
                            <div className="skeleton" style={{ height: '14px', width: '260px' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page">
                <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
                    {error === 'server_error' ? (
                        <>
                            <h1 className="page-title">Something went wrong</h1>
                            <p className="page-subtitle" style={{ marginTop: 'var(--space-md)' }}>Could not load profile for <strong>@{username}</strong>. Please try again.</p>
                        </>
                    ) : (
                        <>
                            <h1 className="page-title">User Not Found</h1>
                            <p className="page-subtitle" style={{ marginTop: 'var(--space-md)' }}>No account exists for <strong>@{username}</strong>.</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: 'var(--space-3xl)' }}>
            <div className="profile-banner">
                {user.profile?.bannerUrl ? (
                    <img src={user.profile.bannerUrl} alt="banner" style={{ objectPosition: user.profile.bannerPosition ?? '50% 50%' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accent}44 0%, var(--bg-secondary) 100%)` }} />
                )}
                <div className="profile-banner-gradient" />
            </div>

            <div className="container">
                <div className="profile-header">
                    <div className="profile-avatar" style={{
                        border: '4px solid var(--bg-primary)',
                        boxShadow: accent !== 'var(--brand)' ? `0 0 0 3px ${accent}44, 0 0 24px ${accent}30` : undefined,
                    }}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.username} style={{ objectPosition: user.profile?.avatarPosition ?? '50% 50%' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, background: `${accent}22`, color: accent }}>
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="profile-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                            <h1 className="profile-username">{user.username}</h1>
                            {user.role === 'owner' && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: '#fff', fontSize: 11, fontWeight: 800,
                                    letterSpacing: '0.08em', textTransform: 'uppercase',
                                    padding: '3px 10px', borderRadius: 20,
                                    boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
                                }}>
                                    <Crown size={11} /> Owner
                                </span>
                            )}
                            {isOwnProfile ? (
                                <Link href="/settings" className="btn btn-ghost btn-sm">Edit Profile</Link>
                            ) : session && (
                                <button onClick={handleFollowToggle} disabled={followLoading} className={`btn btn-sm ${isFollowing ? 'btn-ghost' : 'btn-primary'}`} style={!isFollowing ? { background: accent, borderColor: accent } : {}}>
                                    {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-xs)' }}>
                            {user.profile?.location && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                    <MapPin size={12} /> {user.profile.location}
                                </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                <Calendar size={12} /> Member since {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            </span>
                        </div>
                        {user.profile?.bio && (
                            <p className="profile-bio" style={{ marginTop: 'var(--space-xs)', maxWidth: '480px' }}>{user.profile.bio}</p>
                        )}
                    </div>
                </div>

                <div className="profile-stats-bar" style={{ marginTop: 'var(--space-xl)', gap: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    {([
                        { value: user._count.watchedMovies, label: 'Films', icon: <Eye size={14} />, tab: 'Films' as const },
                        { value: user._count.watchedShows ?? 0, label: 'Shows', icon: <Tv size={14} />, tab: 'TV' as const },
                        { value: user._count.ratings, label: 'Ratings', icon: <Star size={14} />, tab: 'Films' as const },
                        { value: user._count.reviews, label: 'Reviews', icon: <MessageSquare size={14} />, tab: 'Reviews' as const },
                        { value: user._count.watchlist, label: 'Watchlist', icon: <BookmarkPlus size={14} />, tab: 'Watchlist' as const },
                        { value: user._count.followers, label: 'Followers', icon: <Users size={14} />, tab: 'Network' as const, sub: 'followers' as const },
                        { value: user._count.following ?? 0, label: 'Following', icon: <Users size={14} />, tab: 'Network' as const, sub: 'following' as const },
                    ] as const).map((stat, idx, arr) => (
                        <button key={stat.label}
                            onClick={() => { switchTab(stat.tab); if ('sub' in stat && stat.sub) setNetworkTab(stat.sub); }}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: 'var(--space-md) var(--space-sm)', background: 'none', cursor: 'pointer', borderRight: idx < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background var(--duration-fast)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {stat.icon} {stat.label}
                            </span>
                        </button>
                    ))}
                    {user.averageRating && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: 'var(--space-md) var(--space-sm)' }}>
                            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--star-filled)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Star size={18} fill="currentColor" /> {user.averageRating}
                            </span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Rating</span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', marginTop: 'var(--space-xl)', marginBottom: 'var(--space-xl)', position: 'sticky', top: 'var(--header-height)', background: 'var(--bg-primary)', zIndex: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => switchTab(tab)}
                            style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap', color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: activeTab === tab ? `2px solid ${accent}` : '2px solid transparent', marginBottom: '-1px', background: 'none', cursor: 'pointer', transition: 'color var(--duration-fast)' }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'Profile' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3xl)' }}>
                        {/* Top 5 Favorites + Histogram centered together */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <FavoritesSection username={username} isOwnProfile={isOwnProfile} accent={accent} />
                            <TopSeriesSection username={username} isOwnProfile={isOwnProfile} accent={accent} />

                            {/* Rating Distribution — right below, same center alignment */}
                            {userRatingHistogram && userRatingHistogram.total > 0 && (
                                <div style={{ width: '100%', maxWidth: 660, marginTop: 'var(--space-xl)' }}>
                                    <RatingHistogramCard counts={userRatingHistogram.counts} average={userRatingHistogram.average} total={userRatingHistogram.total} />
                                </div>
                            )}
                        </div>

                        {watchedMovies.length > 0 && (
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Recent Films</h2>
                                    {user._count.watchedMovies > 8 && (
                                        <button onClick={() => switchTab('Films')} style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 600, background: 'none', cursor: 'pointer' }}>View all</button>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-sm)' }}>
                                    {watchedMovies.map(wm => (
                                        <MoviePosterCard key={wm.id} href={`/movies/${wm.movie.tmdbId ?? wm.movie.id}`} posterUrl={wm.movie.customPosters?.[0]?.posterUrl ?? wm.movie.posterUrl} title={wm.movie.title} year={wm.movie.year} />
                                    ))}
                                </div>
                            </section>
                        )}
                        {watchedShows.length > 0 && (
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Recent Shows</h2>
                                    {user._count.watchedShows > 8 && (
                                        <button onClick={() => switchTab('TV')} style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 600, background: 'none', cursor: 'pointer' }}>View all</button>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-sm)' }}>
                                    {watchedShows.map(ws => (
                                        <Link key={ws.id} href={`/shows/${ws.tmdbShowId}`} className="movie-card">
                                            {ws.posterUrl ? (
                                                <img src={ws.posterUrl} alt={ws.title} loading="lazy" />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center' }}>
                                                    <Tv size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                                                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{ws.title}</span>
                                                </div>
                                            )}
                                            <div className="movie-card-overlay">
                                                <div className="movie-card-title">{ws.title}</div>
                                                {ws.year && <div className="movie-card-year">{ws.year}</div>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                        {user._count.reviews > 0 && (
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Recent Reviews</h2>
                                    <button onClick={() => switchTab('Reviews')} style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 600, background: 'none', cursor: 'pointer' }}>View all</button>
                                </div>
                                <RecentReviewsPreview username={username} onViewAll={() => switchTab('Reviews')} />
                            </section>
                        )}
                        {watchedMovies.length === 0 && user._count.reviews === 0 && (
                            <EmptyTab icon={<Film size={48} />} text="No activity yet" cta={isOwnProfile ? { label: 'Browse Films', href: '/movies' } : undefined} />
                        )}
                    </div>
                )}

                {activeTab === 'Films' && (
                    <div>
                        {/* Sort + filter bar */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            {/* Sort */}
                            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 3, gap: 2 }}>
                                {([
                                    { key: 'date_desc', label: 'Latest' },
                                    { key: 'date_asc', label: 'Oldest' },
                                    { key: 'rating_desc', label: 'Top Rated' },
                                    { key: 'title_asc', label: 'A–Z' },
                                ] as const).map(s => (
                                    <button key={s.key} onClick={() => { setFilmsSort(s.key); setFilmsPage(1); }}
                                        style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: filmsSort === s.key ? 700 : 500, background: filmsSort === s.key ? accent : 'transparent', color: filmsSort === s.key ? '#000' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.12s' }}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                            {/* Rating filter */}
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                <button onClick={() => { setFilmsRatingFilter(null); setFilmsPage(1); }}
                                    style={{ padding: '4px 10px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: filmsRatingFilter === null ? 700 : 500, background: filmsRatingFilter === null ? 'var(--bg-secondary)' : 'transparent', border: filmsRatingFilter === null ? `1.5px solid ${accent}` : '1.5px solid transparent', color: filmsRatingFilter === null ? 'var(--text-primary)' : 'var(--text-tertiary)', cursor: 'pointer' }}>
                                    All ★
                                </button>
                                {[10, 9, 8, 7, 6, 5].map(r => (
                                    <button key={r} onClick={() => { setFilmsRatingFilter(filmsRatingFilter === r ? null : r); setFilmsPage(1); }}
                                        style={{ padding: '4px 10px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: filmsRatingFilter === r ? 700 : 400, background: filmsRatingFilter === r ? '#fbbf24' : 'transparent', border: filmsRatingFilter === r ? '1.5px solid #fbbf24' : '1.5px solid var(--border-subtle)', color: filmsRatingFilter === r ? '#000' : 'var(--text-tertiary)', cursor: 'pointer' }}>
                                        {r}★+
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!allFilmsLoaded ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 'var(--space-sm)' }}>
                                {Array.from({ length: 20 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />)}
                            </div>
                        ) : allFilms.length === 0 ? (
                            <EmptyTab icon={<Eye size={48} />} text={filmsRatingFilter ? `No films rated ${filmsRatingFilter}★ or higher` : 'No films logged yet'} cta={isOwnProfile && !filmsRatingFilter ? { label: 'Browse Films', href: '/movies' } : undefined} />
                        ) : (
                            <>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }}>
                                    {filmsTotalCount.toLocaleString()} film{filmsTotalCount !== 1 ? 's' : ''}
                                    {filmsRatingFilter ? ` rated ${filmsRatingFilter}★+` : ' watched'}
                                    {filmsTotalPages > 1 ? ` · Page ${filmsPage} of ${filmsTotalPages}` : ''}
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 'var(--space-sm)' }}>
                                    {allFilms.map(wm => (
                                        <div key={wm.id} style={{ position: 'relative' }}>
                                            <MoviePosterCard href={`/movies/${wm.movie.tmdbId ?? wm.movie.id}`} posterUrl={wm.movie.customPosters?.[0]?.posterUrl ?? wm.movie.posterUrl} title={wm.movie.title} year={wm.movie.year} />
                                            {(wm as WatchedMovie & { rating?: number }).rating && (
                                                <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700, color: '#fbbf24' }}>
                                                    {(wm as WatchedMovie & { rating?: number }).rating}★
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {filmsTotalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-2xl)', alignItems: 'center' }}>
                                        <button className="btn btn-ghost btn-sm" disabled={filmsPage <= 1} onClick={() => setFilmsPage(p => p - 1)}>← Prev</button>
                                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', padding: '0 var(--space-sm)' }}>{filmsPage} / {filmsTotalPages}</span>
                                        <button className="btn btn-ghost btn-sm" disabled={filmsPage >= filmsTotalPages} onClick={() => setFilmsPage(p => p + 1)}>Next →</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ─── TV Shows Tab ──────────────────────────────────────────────── */}
                {activeTab === 'TV' && (
                    <div>
                        {/* Sort + rating filter bar */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            {/* Sort */}
                            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 3, gap: 2 }}>
                                {([
                                    { key: 'date_desc', label: 'Latest' },
                                    { key: 'date_asc', label: 'Oldest' },
                                    { key: 'rating_desc', label: 'Top Rated' },
                                    { key: 'title_asc', label: 'A–Z' },
                                    { key: 'title_desc', label: 'Z–A' },
                                ] as const).map(s => (
                                    <button key={s.key} onClick={() => { setShowsSort(s.key); setShowsPage(1); }}
                                        style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: showsSort === s.key ? 700 : 500, background: showsSort === s.key ? accent : 'transparent', color: showsSort === s.key ? '#000' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.12s' }}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                            {/* Rating filter */}
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                <button onClick={() => { setShowsRatingFilter(null); setShowsPage(1); }}
                                    style={{ padding: '4px 10px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: showsRatingFilter === null ? 700 : 500, background: showsRatingFilter === null ? 'var(--bg-secondary)' : 'transparent', border: showsRatingFilter === null ? `1.5px solid ${accent}` : '1.5px solid transparent', color: showsRatingFilter === null ? 'var(--text-primary)' : 'var(--text-tertiary)', cursor: 'pointer' }}>
                                    All ★
                                </button>
                                {[10, 9, 8, 7, 6, 5].map(r => (
                                    <button key={r} onClick={() => { setShowsRatingFilter(showsRatingFilter === r ? null : r); setShowsPage(1); }}
                                        style={{ padding: '4px 10px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: showsRatingFilter === r ? 700 : 400, background: showsRatingFilter === r ? '#fbbf24' : 'transparent', border: showsRatingFilter === r ? '1.5px solid #fbbf24' : '1.5px solid var(--border-subtle)', color: showsRatingFilter === r ? '#000' : 'var(--text-tertiary)', cursor: 'pointer' }}>
                                        {r}★+
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Watched grid */}
                        {!allShowsLoaded ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 'var(--space-sm)' }}>
                                {Array.from({ length: 20 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />)}
                            </div>
                        ) : allShows.length === 0 && showWatchlist.length === 0 ? (
                            <EmptyTab icon={<Tv size={48} />} text={showsRatingFilter ? `No shows rated ${showsRatingFilter}★ or higher` : 'No shows logged yet'} cta={isOwnProfile && !showsRatingFilter ? { label: 'Browse TV Shows', href: '/shows' } : undefined} />
                        ) : (
                            <>
                                {allShows.length > 0 && (
                                    <>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }}>
                                            {showsTotalCount.toLocaleString()} show{showsTotalCount !== 1 ? 's' : ''}
                                            {showsRatingFilter ? ` rated ${showsRatingFilter}★+` : ' watched'}
                                            {showsTotalPages > 1 ? ` · Page ${showsPage} of ${showsTotalPages}` : ''}
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 'var(--space-sm)' }}>
                                            {allShows.map(ws => (
                                                <div key={ws.id} style={{ position: 'relative' }}>
                                                    <Link href={`/shows/${ws.tmdbShowId}`} className="movie-card">
                                                        {ws.posterUrl ? (
                                                            <img src={ws.posterUrl} alt={ws.title} loading="lazy" />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center' }}>
                                                                <Tv size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
                                                                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{ws.title}</span>
                                                            </div>
                                                        )}
                                                        <div className="movie-card-overlay">
                                                            <div className="movie-card-title">{ws.title}</div>
                                                            {ws.year && <div className="movie-card-year">{ws.year}</div>}
                                                        </div>
                                                    </Link>
                                                    {ws.rating != null && (() => {
                                                        const s = Math.round((ws.rating / 10) * 5 * 2) / 2;
                                                        return (
                                                            <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.82)', borderRadius: 4, padding: '2px 5px', pointerEvents: 'none', display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                {[1, 2, 3, 4, 5].map(i => (
                                                                    <Star key={i} size={8} fill={s >= i ? 'currentColor' : 'none'} stroke="currentColor" style={{ color: '#fbbf24', opacity: s >= i - 0.5 ? 1 : 0.2 }} />
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ))}
                                        </div>
                                        {showsTotalPages > 1 && (
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-2xl)', alignItems: 'center' }}>
                                                <button className="btn btn-ghost btn-sm" disabled={showsPage <= 1} onClick={() => setShowsPage(p => p - 1)}>← Prev</button>
                                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', padding: '0 var(--space-sm)' }}>{showsPage} / {showsTotalPages}</span>
                                                <button className="btn btn-ghost btn-sm" disabled={showsPage >= showsTotalPages} onClick={() => setShowsPage(p => p + 1)}>Next →</button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Show Watchlist section */}
                                {showWatchlist.length > 0 && (
                                    <section style={{ marginTop: allShows.length > 0 ? 'var(--space-3xl)' : 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Want to Watch</h2>
                                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{showWatchlist.length} saved</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 'var(--space-sm)' }}>
                                            {showWatchlist.map(sw => (
                                                <Link key={sw.id} href={`/shows/${sw.tmdbShowId}`} className="movie-card">
                                                    {sw.posterUrl ? (
                                                        <img src={sw.posterUrl} alt={sw.title} loading="lazy" />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center' }}>
                                                            <Tv size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
                                                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{sw.title}</span>
                                                        </div>
                                                    )}
                                                    <div className="movie-card-overlay">
                                                        <div className="movie-card-title">{sw.title}</div>
                                                        {sw.year && <div className="movie-card-year">{sw.year}</div>}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'Reviews' && (
                    <div>
                        {!reviewsLoaded ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />)}
                            </div>
                        ) : reviews.length === 0 ? (
                            <EmptyTab icon={<MessageSquare size={48} />} text="No reviews written yet" />
                        ) : (
                            <>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    {reviews.map(review => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            revealed={revealedSpoilers.has(review.id)}
                                            onReveal={() => setRevealedSpoilers(prev => new Set([...prev, review.id]))}
                                            isOwn={isOwnProfile}
                                            onUpdate={updated => setReviews(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))}
                                            onDelete={id => { setReviews(prev => prev.filter(r => r.id !== id)); setUser(prev => prev ? { ...prev, _count: { ...prev._count, reviews: prev._count.reviews - 1 } } : prev); }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'Watchlist' && (
                    <div>
                        {/* Sub-tab switcher */}
                        <div style={{ display: 'flex', gap: 'var(--space-xl)', borderBottom: '1px solid var(--border-default)', marginBottom: 'var(--space-xl)' }}>
                            {(['movies', 'shows'] as const).map(sub => (
                                <button key={sub} onClick={() => setWatchlistSubTab(sub)}
                                    style={{ padding: '0.5rem 0', fontWeight: 700, fontSize: 'var(--text-sm)', color: watchlistSubTab === sub ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: watchlistSubTab === sub ? `2px solid ${accent}` : '2px solid transparent', marginBottom: '-1px', background: 'none', cursor: 'pointer' }}
                                >
                                    {sub === 'movies' ? 'Films' : 'TV Shows'}
                                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                                        {sub === 'movies' ? watchlist.length : showWatchlist.length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Films sub-tab */}
                        {watchlistSubTab === 'movies' && (
                            !watchlistLoaded ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 'var(--space-sm)' }}>
                                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />)}
                                </div>
                            ) : watchlist.length === 0 ? (
                                <EmptyTab icon={<BookmarkPlus size={48} />} text="Watchlist is empty" cta={isOwnProfile ? { label: 'Browse Films', href: '/movies' } : undefined} />
                            ) : (
                                <>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>{watchlist.length} film{watchlist.length !== 1 ? 's' : ''} saved</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 'var(--space-sm)' }}>
                                        {watchlist.map(item => (
                                            <MoviePosterCard key={item.id} href={`/movies/${item.movie.tmdbId ?? item.movie.id}`} posterUrl={item.movie.customPosters?.[0]?.posterUrl ?? item.movie.posterUrl} title={item.movie.title} year={item.movie.year} />
                                        ))}
                                    </div>
                                </>
                            )
                        )}

                        {/* TV Shows sub-tab */}
                        {watchlistSubTab === 'shows' && (
                            !showWatchlistLoaded ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 'var(--space-sm)' }}>
                                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />)}
                                </div>
                            ) : showWatchlist.length === 0 ? (
                                <EmptyTab icon={<BookmarkPlus size={48} />} text="No shows saved yet" cta={isOwnProfile ? { label: 'Browse Shows', href: '/shows' } : undefined} />
                            ) : (
                                <>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>{showWatchlist.length} show{showWatchlist.length !== 1 ? 's' : ''} saved</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 'var(--space-sm)' }}>
                                        {showWatchlist.map(sw => (
                                            <Link key={sw.id} href={`/shows/${sw.tmdbShowId}`} className="movie-card">
                                                {sw.posterUrl ? (
                                                    <img src={sw.posterUrl} alt={sw.title} loading="lazy" />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center' }}>
                                                        <Tv size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                                                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{sw.title}</span>
                                                    </div>
                                                )}
                                                <div className="movie-card-overlay">
                                                    <div className="movie-card-title">{sw.title}</div>
                                                    {sw.year && <div className="movie-card-year">{sw.year}</div>}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )
                        )}
                    </div>
                )}

                {activeTab === 'Lists' && (
                    <div>
                        {!listsLoaded ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
                                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />)}
                            </div>
                        ) : userLists.length === 0 ? (
                            <EmptyTab
                                icon={<List size={48} />}
                                text="No lists yet"
                                cta={isOwnProfile ? { label: 'Create a List', href: '/lists' } : undefined}
                            />
                        ) : (
                            <>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>
                                    {userLists.length} list{userLists.length !== 1 ? 's' : ''}
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
                                    {userLists.map(list => (
                                        <a key={list.id} href={`/lists/${list.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', transition: 'border-color 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
                                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                {list.isPublic
                                                    ? <Globe size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                                    : <Lock size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                                }
                                                <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{list.title}</p>
                                            </div>
                                            {list.description && (
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8, lineHeight: 1.5 }}>{list.description}</p>
                                            )}
                                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Film size={11} /> {list._count.movies} film{list._count.movies !== 1 ? 's' : ''}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'Network' && (
                    <div>
                        <div style={{ display: 'flex', gap: 'var(--space-xl)', borderBottom: '1px solid var(--border-default)', marginBottom: 'var(--space-xl)' }}>
                            {(['followers', 'following'] as const).map(sub => (
                                <button key={sub} onClick={() => setNetworkTab(sub)}
                                    style={{ padding: '0.5rem 0', fontWeight: 700, fontSize: 'var(--text-sm)', color: networkTab === sub ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: networkTab === sub ? `2px solid ${accent}` : '2px solid transparent', marginBottom: '-1px', background: 'none', cursor: 'pointer', textTransform: 'capitalize' }}
                                >
                                    {sub} {sub === 'followers' ? `(${user._count.followers ?? 0})` : `(${user._count.following ?? 0})`}
                                </button>
                            ))}
                        </div>
                        {!networkLoaded ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '64px', borderRadius: 'var(--radius-lg)' }} />)}
                            </div>
                        ) : (
                            <NetworkList
                                users={networkTab === 'followers' ? (network?.followers ?? []) : (network?.following ?? [])}
                                emptyText={networkTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                                currentUserId={session?.user?.id}
                            />
                        )}
                    </div>
                )}

                {/* ─── Achievements Tab ─────────────────────────────────────────── */}
                {activeTab === 'Achievements' && (
                    <div>
                        {/* Header + progress */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                            <div>
                                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Achievements</h2>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                    {achievementsLoaded ? `${earnedCount} of ${ACHIEVEMENTS.length} unlocked` : 'Loading…'}
                                </p>
                            </div>
                            {achievementsLoaded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>
                                        {Math.round((earnedCount / ACHIEVEMENTS.length) * 100)}% complete
                                    </div>
                                    <div style={{ width: 200, height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ width: `${(earnedCount / ACHIEVEMENTS.length) * 100}%`, height: '100%', background: accent, borderRadius: 4, transition: 'width 0.6s ease' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Oscar vote card — only for own profile */}
                        {isOwnProfile && pollData?.poll && (
                            <div style={{ marginBottom: 'var(--space-3xl)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 16, overflow: 'hidden' }}>
                                {/* Card header */}
                                <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Clapperboard size={20} style={{ color: '#d4af37', flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>
                                                Best Picture Poll {pollData.poll.year}
                                            </span>
                                            {pollData.poll.isOpen && !pollData.userVote && (
                                                <span style={{ background: '#22c55e22', color: '#22c55e', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid #22c55e44' }}>
                                                    Live
                                                </span>
                                            )}
                                            {pollData.userVote && (
                                                <span style={{ background: `${accent}22`, color: accent, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    Voted
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                            {pollData.userVote
                                                ? `Your vote: ${pollData.userVote.movieTitle}`
                                                : 'Vote to earn the Oscar Voter \'26 badge — you can change your vote anytime'}
                                        </p>
                                    </div>
                                    {pollData.totalVotes > 0 && (
                                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{pollData.totalVotes}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Votes</div>
                                        </div>
                                    )}
                                </div>

                                {/* Nominees grid / results */}
                                <div style={{ padding: 'var(--space-lg) var(--space-xl)' }}>
                                    {/* Show results if user has voted */}
                                    {pollData.userVote && pollData.results ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {pollData.results.map(r => {
                                                const isUserVote = r.movieTitle === pollData.userVote?.movieTitle;
                                                const isLeader = r.movieTitle === pollData.results![0].movieTitle;
                                                return (
                                                    <div key={r.movieTitle}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                            <span style={{ fontSize: 13, fontWeight: isUserVote ? 700 : 500, color: isUserVote ? accent : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                {isUserVote && <CheckCircle2 size={13} style={{ color: accent }} />}
                                                                {isLeader && !isUserVote && <Trophy size={13} style={{ color: '#f59e0b' }} />}
                                                                {r.movieTitle}
                                                            </span>
                                                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>{r.pct}%</span>
                                                        </div>
                                                        <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${r.pct}%`, background: isUserVote ? accent : isLeader ? '#f59e0b' : 'var(--border-default)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <button
                                                onClick={() => { setPollData(prev => prev ? { ...prev, userVote: null, results: null } : null); }}
                                                style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)', background: 'none', cursor: 'pointer', alignSelf: 'flex-start', textDecoration: 'underline' }}
                                            >
                                                Change vote
                                            </button>
                                        </div>
                                    ) : (
                                        /* Nominee selection */
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 'var(--space-md)' }}>
                                                {pollData.poll.nominees.map(nominee => {
                                                    const selected = votingFor === nominee.title;
                                                    return (
                                                        <button
                                                            key={nominee.title}
                                                            onClick={() => handleVoteSelect(nominee.title)}
                                                            style={{
                                                                padding: 0, textAlign: 'left', background: 'none',
                                                                border: `3px solid ${selected ? accent : 'transparent'}`,
                                                                borderRadius: 10, cursor: 'pointer',
                                                                transition: 'all 0.15s',
                                                                outline: 'none',
                                                                transform: selected ? 'scale(1.03)' : 'scale(1)',
                                                                boxShadow: selected ? `0 6px 20px ${accent}50` : '0 2px 8px rgba(0,0,0,0.25)',
                                                                overflow: 'hidden',
                                                                position: 'relative',
                                                            }}
                                                        >
                                                            {/* Poster */}
                                                            <div style={{ aspectRatio: '2/3', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
                                                                {nominee.posterUrl
                                                                    ? <img src={nominee.posterUrl} alt={nominee.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /></div>
                                                                }
                                                                {/* Selected overlay */}
                                                                {selected && (
                                                                    <div style={{ position: 'absolute', inset: 0, background: `${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <CheckCircle2 size={36} style={{ color: accent, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Title bar */}
                                                            <div style={{ padding: '8px 10px', background: selected ? `${accent}18` : 'var(--bg-secondary)' }}>
                                                                <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, color: selected ? accent : 'var(--text-primary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{nominee.title}</div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {votingFor && (
                                                <button
                                                    onClick={handleVoteSubmit}
                                                    disabled={voteLoading}
                                                    style={{ padding: '10px 28px', background: accent, color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 'var(--text-sm)', cursor: voteLoading ? 'not-allowed' : 'pointer', opacity: voteLoading ? 0.7 : 1, transition: 'opacity 0.2s' }}
                                                >
                                                    {voteLoading ? 'Submitting…' : `Vote for "${votingFor}"`}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Skeleton loading state */}
                        {!achievementsLoaded && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 'var(--space-xl)' }}>
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                        <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%' }} />
                                        <div className="skeleton" style={{ width: 60, height: 10, borderRadius: 4 }} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Achievement categories */}
                        {achievementsLoaded && ACHIEVEMENT_CATEGORIES.map(cat => {
                            const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat.id);
                            return (
                                <section key={cat.id} style={{ marginBottom: 'var(--space-3xl)' }}>
                                    <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {cat.label}
                                        <span style={{ fontSize: 10, background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 20, color: 'var(--text-muted)', fontWeight: 600 }}>
                                            {catAchievements.filter(a => earnedMap[a.id]).length}/{catAchievements.length}
                                        </span>
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 'var(--space-xl)' }}>
                                        {catAchievements.map(achievement => {
                                            const earned = earnedMap[achievement.id];
                                            const IconComp = ACHIEVEMENT_ICON_MAP[achievement.icon as AchievementIconKey];
                                            const isHovered = hoveredAchievement === achievement.id;
                                            return (
                                                <div
                                                    key={achievement.id}
                                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', cursor: 'default' }}
                                                    onMouseEnter={() => setHoveredAchievement(achievement.id)}
                                                    onMouseLeave={() => setHoveredAchievement(null)}
                                                >
                                                    {/* Badge circle */}
                                                    <div style={{
                                                        width: 68, height: 68, borderRadius: '50%',
                                                        background: earned ? achievement.gradient : 'var(--bg-secondary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        filter: earned ? 'none' : 'grayscale(1)',
                                                        opacity: earned ? 1 : 0.3,
                                                        boxShadow: earned && isHovered ? `0 6px 24px ${achievement.color}60` : earned ? `0 3px 12px ${achievement.color}40` : 'none',
                                                        border: earned ? `2px solid ${achievement.color}` : '2px solid var(--border-subtle)',
                                                        transform: isHovered && earned ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                                                        transition: 'all 0.2s ease',
                                                        position: 'relative',
                                                    }}>
                                                        {IconComp && <IconComp size={27} color={earned ? '#fff' : 'var(--text-tertiary)'} strokeWidth={1.5} />}
                                                    </div>

                                                    {/* Label */}
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, color: earned ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                                            {achievement.title}
                                                        </div>
                                                        <div style={{ fontSize: 9, marginTop: 2, color: earned ? RARITY_COLORS[achievement.rarity as AchievementRarity] : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                            {achievement.rarityLabel}
                                                        </div>
                                                    </div>

                                                    {/* Tooltip */}
                                                    {isHovered && (
                                                        <div style={{
                                                            position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
                                                            background: 'var(--bg-elevated)', border: `1px solid ${earned ? achievement.color + '60' : 'var(--border-default)'}`,
                                                            borderRadius: 12, padding: '10px 14px', minWidth: 190, maxWidth: 220, zIndex: 200,
                                                            boxShadow: `0 8px 32px rgba(0,0,0,0.35)`,
                                                            pointerEvents: 'none',
                                                        }}>
                                                            <div style={{ fontWeight: 800, fontSize: 13, color: earned ? achievement.color : 'var(--text-primary)', marginBottom: 5 }}>{achievement.title}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{achievement.description}</div>
                                                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: RARITY_COLORS[achievement.rarity as AchievementRarity], background: `${RARITY_COLORS[achievement.rarity as AchievementRarity]}18`, padding: '2px 7px', borderRadius: 20 }}>
                                                                    {achievement.rarityLabel}
                                                                </span>
                                                                {earned
                                                                    ? <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>✓ {new Date(earned.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                    : <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>🔒 Locked</span>
                                                                }
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}