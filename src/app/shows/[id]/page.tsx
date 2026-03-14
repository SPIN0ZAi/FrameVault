'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tv, Eye, Check, BookmarkPlus, Star, Play, X, Users, Calendar, Globe, Layers, Clock, ImagePlus, ListPlus, Edit3, Loader2, Pencil, Trash2, Crown, AlertTriangle, Heart, RefreshCw } from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';
import { useBackdropBrightness } from '@/lib/hooks/useBackdropBrightness';

interface ShowDetail {
    id: string;
    title: string;
    year: number;
    lastAirYear: number | null;
    posterUrl: string | null;
    backdropUrl: string | null;
    description: string | null;
    genres: { id: number; name: string }[];
    numberOfSeasons: number | null;
    numberOfEpisodes: number | null;
    language: string | null;
    networks: { id: number; name: string; logoUrl: string | null }[];
    status: string | null;
    tagline: string | null;
    createdBy: { id: number; name: string; profileUrl: string | null }[];
    episodeRuntime: number | null;
    voteAverage: number;
    voteCount: number;
    nextEpisode: { air_date: string; name: string } | null;
    seasons: { id: number; name: string; seasonNumber: number; episodeCount: number; posterUrl: string | null }[];
    cast: { id: number; name: string; character: string; profileUrl: string | null }[];
    trailerKey: string | null;
    similarShows: { id: number; title: string; year: number; posterUrl: string | null }[];
    reviews: {
        id: string;
        content: string;
        containsSpoilers: boolean;
        createdAt: string;
        user: { id: string; username: string; avatarUrl: string | null; role: string };
        likeCount: number;
        likedByMe: boolean;
    }[];
    userInteraction: {
        watched: boolean;
        inWatchlist: boolean;
        rating: number | null;
        customPosterUrl: string | null;
        hasReview: boolean;
        rewatchCount: number;
        lastRewatchedAt: string | null;
    };
}

function getLanguageName(code: string | null): string | null {
    if (!code) return null;
    try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code.toUpperCase(); }
    catch { return code.toUpperCase(); }
}

function StarDisplay({ value }: { value: number }) {
    const stars = Math.round((value / 10) * 5 * 2) / 2;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={14} fill={stars >= i ? 'currentColor' : 'none'} stroke="currentColor"
                    style={{ color: 'var(--star-filled)', opacity: stars >= i - 0.5 ? 1 : 0.25 }} />
            ))}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--star-filled)', marginLeft: 4 }}>
                {(value / 2).toFixed(1)}
            </span>
        </div>
    );
}

export default function ShowDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: session } = useSession();
    const router = useRouter();
    const backdropBrightness = useBackdropBrightness();
    const [show, setShow] = useState<ShowDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [showWatchPrompt, setShowWatchPrompt] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [posterHover, setPosterHover] = useState(false);
    const [showPosterModal, setShowPosterModal] = useState(false);
    const [posterTab, setPosterTab] = useState<'pick' | 'upload'>('pick');
    const [tmdbPosters, setTmdbPosters] = useState<{ thumb: string | null; full: string | null }[]>([]);

    // List modal
    const [showListModal, setShowListModal] = useState(false);
    const [userLists, setUserLists] = useState<{ id: string; title: string; _count?: { movies: number } }[]>([]);
    const [listsLoading, setListsLoading] = useState(false);
    const [addingToListId, setAddingToListId] = useState<string | null>(null);
    const [listAddedId, setListAddedId] = useState<string | null>(null);

    // Review form
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [spoiler, setSpoiler] = useState(false);

    // Review editing
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editReviewText, setEditReviewText] = useState('');
    const [editReviewSpoiler, setEditReviewSpoiler] = useState(false);
    const [savingEditReview, setSavingEditReview] = useState(false);
    const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null);
    const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

    // Review likes
    const [reviewLikes, setReviewLikes] = useState<Record<string, { count: number; liked: boolean }>>({});

    // Revealed spoilers
    const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

    const closePosterModal = () => {
        setShowPosterModal(false);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadError(null);
    };
    const [tmdbPostersLoading, setTmdbPostersLoading] = useState(false);
    const [applyingPoster, setApplyingPoster] = useState<string | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const fetchShow = useCallback(async () => {
        try {
            const res = await fetch(`/api/shows/${id}`);
            const data = await res.json();
            if (data.success) {
                setShow(data.data);
                if (data.data?.id && String(data.data.id) !== String(id)) {
                    router.replace(`/shows/${data.data.id}`);
                }
            }
            else { setLoading(false); return; }
        } catch { }
        finally { setLoading(false); }
    }, [id, router]);

    useEffect(() => { fetchShow(); }, [fetchShow]);

    // Initialize reviewLikes map whenever show data loads
    useEffect(() => {
        if (!show) return;
        const map: Record<string, { count: number; liked: boolean }> = {};
        show.reviews.forEach(r => { map[r.id] = { count: r.likeCount, liked: r.likedByMe }; });
        setReviewLikes(map);
    }, [show]);

    const handleLikeReview = async (reviewId: string) => {
        if (!session) { router.push('/login'); return; }
        const current = reviewLikes[reviewId] ?? { count: 0, liked: false };
        setReviewLikes(prev => ({
            ...prev,
            [reviewId]: { count: current.liked ? current.count - 1 : current.count + 1, liked: !current.liked },
        }));
        try {
            const method = current.liked ? 'DELETE' : 'POST';
            const res = await fetch(`/api/show-reviews/${reviewId}/like`, { method });
            const data = await res.json();
            if (data.success) {
                setReviewLikes(prev => ({ ...prev, [reviewId]: { count: data.data.likeCount, liked: data.data.likedByMe } }));
            }
        } catch {
            setReviewLikes(prev => ({ ...prev, [reviewId]: current }));
        }
    };

    const handleOpenListModal = async () => {
        if (!session) { router.push('/login'); return; }
        setShowListModal(true);
        if (userLists.length === 0) {
            setListsLoading(true);
            const res = await fetch('/api/lists/mine');
            const data = await res.json();
            if (data.success) setUserLists(data.data);
            setListsLoading(false);
        }
    };

    const handleAddToList = async (listId: string) => {
        if (!show) return;
        setAddingToListId(listId);
        await fetch(`/api/lists/${listId}/movies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tmdbId: Number(id),
                title: show.title,
                year: show.year,
                posterUrl: show.userInteraction?.customPosterUrl || show.posterUrl,
                mediaType: 'show',
            }),
        });
        setAddingToListId(null);
        setListAddedId(listId);
        setTimeout(() => setListAddedId(null), 2000);
    };

    const handleReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) { router.push('/login'); return; }
        if (reviewText.trim().length < 10) return;
        setActionLoading('review');
        try {
            const res = await fetch(`/api/shows/${id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: reviewText, containsSpoilers: spoiler }),
            });
            if (res.ok) {
                setReviewText('');
                setSpoiler(false);
                setShowReviewForm(false);
                await fetchShow();
            }
        } finally {
            setActionLoading('');
        }
    };

    const handleSaveEditReview = async () => {
        if (!editingReviewId || editReviewText.trim().length < 10) return;
        setSavingEditReview(true);
        try {
            const res = await fetch(`/api/show-reviews/${editingReviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editReviewText.trim(), containsSpoilers: editReviewSpoiler }),
            });
            if (res.ok) { setEditingReviewId(null); await fetchShow(); }
        } finally { setSavingEditReview(false); }
    };

    const handleDeleteReview = async (reviewId: string) => {
        setDeletingReviewId(reviewId);
        try {
            const res = await fetch(`/api/show-reviews/${reviewId}`, { method: 'DELETE' });
            if (res.ok) { setConfirmDeleteReviewId(null); await fetchShow(); }
        } finally { setDeletingReviewId(null); }
    };

    useEffect(() => {
        if (!showPosterModal || tmdbPosters.length > 0) return;
        setTmdbPostersLoading(true);
        fetch(`/api/shows/${id}/tmdb-posters`)
            .then(r => r.json())
            .then(d => { if (d.success) setTmdbPosters(d.data); })
            .finally(() => setTmdbPostersLoading(false));
    }, [showPosterModal, id, tmdbPosters.length]);

    const handlePickTmdbPoster = async (fullUrl: string) => {
        setApplyingPoster(fullUrl);
        try {
            await fetch(`/api/shows/${id}/custom-poster`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ posterUrl: fullUrl }),
            });
            setShowPosterModal(false);
            fetchShow();
        } finally { setApplyingPoster(null); }
    };

    const handleWatchToggle = async () => {
        if (!session) { router.push('/login'); return; }
        if (!show) return;
        setActionLoading('watch');
        try {
            const isWatched = show.userInteraction.watched;
            const method = isWatched ? 'DELETE' : 'POST';
            const targetId = show.id || id;
            const res = await fetch(`/api/watched-shows/${targetId}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method === 'POST'
                    ? JSON.stringify({ title: show.title, year: show.year, posterUrl: show.posterUrl })
                    : undefined,
            });
            const data = await res.json().catch(() => null);
            if (!(res.ok && data?.success)) {
                await fetchShow();
                return;
            }
            await fetchShow();
        } finally { setActionLoading(''); }
    };

    const handleRewatch = async () => {
        if (!session) { router.push('/login'); return; }
        if (!show) return;
        setActionLoading('rewatch');
        try {
            const targetId = show.id || id;
            const res = await fetch(`/api/shows/${targetId}/rewatch`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setShow(prev => prev ? {
                    ...prev,
                    userInteraction: {
                        ...prev.userInteraction,
                        watched: true,
                        inWatchlist: false,
                        rewatchCount: data.data.rewatchCount,
                        lastRewatchedAt: data.data.lastRewatchedAt,
                    },
                } : prev);
            }
        } finally { setActionLoading(''); }
    };

    const handleWatchlistToggle = async () => {
        if (!session) { router.push('/login'); return; }
        if (!show) return;
        setActionLoading('watchlist');
        try {
            const inWatchlist = show.userInteraction.inWatchlist;
            const method = inWatchlist ? 'DELETE' : 'POST';
            const targetId = show.id || id;
            const res = await fetch(`/api/show-watchlist/${targetId}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method === 'POST'
                    ? JSON.stringify({ title: show.title, year: show.year, posterUrl: show.posterUrl })
                    : undefined,
            });
            const data = await res.json().catch(() => null);
            if (!(res.ok && data?.success)) {
                await fetchShow();
                return;
            }
            setShow(prev => prev ? {
                ...prev,
                userInteraction: { ...prev.userInteraction, inWatchlist: !inWatchlist },
            } : prev);
        } finally { setActionLoading(''); }
    };

    const handleRate = async (value: number) => {
        if (!session) { router.push('/login'); return; }
        if (!show) return;
        setActionLoading('rating');
        try {
            const isSame = show.userInteraction.rating === value;
            const targetId = show.id || id;
            if (isSame) {
                await fetch(`/api/shows/${targetId}/rating`, { method: 'DELETE' });
            } else {
                await fetch(`/api/shows/${targetId}/rating`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value }),
                });
                if (!show.userInteraction.watched) setShowWatchPrompt(true);
            }
            setShow(prev => prev ? {
                ...prev,
                userInteraction: { ...prev.userInteraction, rating: isSame ? null : value },
            } : prev);
        } finally { setActionLoading(''); }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: 'var(--space-3xl)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2xl)', flexWrap: 'wrap' }}>
                        <div className="skeleton" style={{ width: 260, height: 390, borderRadius: 'var(--radius-xl)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div className="skeleton" style={{ height: 40, width: '60%', borderRadius: 8 }} />
                            <div className="skeleton" style={{ height: 20, width: '40%', borderRadius: 6 }} />
                            <div className="skeleton" style={{ height: 100, borderRadius: 8 }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!show) {
        return (
            <div className="page">
                <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
                    <Tv size={64} style={{ opacity: 0.3, marginBottom: 'var(--space-lg)' }} />
                    <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>Show not found</h1>
                    <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-xl)' }}>This TV show doesn't exist or could not be loaded.</p>
                    <Link href="/shows" className="btn btn-primary">Browse TV Shows</Link>
                </div>
            </div>
        );
    }

    const airYears = show.lastAirYear && show.lastAirYear !== show.year
        ? `${show.year}–${show.status === 'Ended' || show.status === 'Canceled' ? show.lastAirYear : 'present'}`
        : show.year.toString();

    const statusColor: Record<string, string> = {
        'Returning Series': '#22c55e',
        'In Production': '#3b82f6',
        'Planned': '#a855f7',
        'Ended': 'var(--text-tertiary)',
        'Canceled': '#ef4444',
    };

    return (
        <div className="page">
            {/* Backdrop */}
            {show.backdropUrl && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                    <img src={show.backdropUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: (backdropBrightness / 100) * 0.25 }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, var(--bg-primary) 70%)' }} />
                </div>
            )}

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Hero */}
                <div style={{ display: 'flex', gap: 'var(--space-2xl)', flexWrap: 'wrap', paddingTop: 'var(--space-3xl)' }}>
                    {/* Poster */}
                    <div
                        style={{ flexShrink: 0, width: 220, position: 'relative' }}
                        onMouseEnter={() => setPosterHover(true)}
                        onMouseLeave={() => setPosterHover(false)}
                    >
                        <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', aspectRatio: '2/3' }}>
                            {show.userInteraction.customPosterUrl || show.posterUrl ? (
                                <img src={show.userInteraction.customPosterUrl || show.posterUrl!} alt={show.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Tv size={64} style={{ opacity: 0.3 }} />
                                </div>
                            )}
                        </div>
                        {session && (
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: 'var(--radius-xl)',
                                background: 'rgba(0,0,0,0.65)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: posterHover ? 1 : 0,
                                transition: 'opacity 0.2s ease',
                                backdropFilter: 'blur(3px)',
                            }}>
                                <button
                                    onClick={() => setShowPosterModal(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer' }}
                                >
                                    <ImagePlus size={18} /> Change Poster
                                </button>
                            </div>
                        )}

                        {(show.userInteraction.rewatchCount ?? 0) > 0 && (
                            <div style={{
                                position: 'absolute',
                                bottom: 10,
                                left: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                background: 'rgba(0,0,0,0.82)',
                                border: '1.5px solid var(--brand)',
                                borderRadius: 999,
                                padding: '4px 10px 4px 7px',
                                backdropFilter: 'blur(6px)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                                pointerEvents: 'none',
                            }}>
                                <RefreshCw size={11} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.02em', lineHeight: 1 }}>
                                    ×{show.userInteraction.rewatchCount}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 260 }}>
                        {/* Genres */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
                            {show.genres.map(g => (
                                <span key={g.id} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 'var(--text-xs)', fontWeight: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                                    {g.name}
                                </span>
                            ))}
                        </div>

                        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, lineHeight: 1.15, marginBottom: 'var(--space-xs)' }}>{show.title}</h1>
                        {show.tagline && (
                            <p style={{ fontSize: 'var(--text-sm)', fontStyle: 'italic', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>"{show.tagline}"</p>
                        )}

                        {/* Meta row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', alignItems: 'center', marginBottom: 'var(--space-lg)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={13} /> {airYears}
                            </span>
                            {show.numberOfSeasons && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Layers size={13} /> {show.numberOfSeasons} season{show.numberOfSeasons !== 1 ? 's' : ''}
                                </span>
                            )}
                            {show.numberOfEpisodes && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Tv size={13} /> {show.numberOfEpisodes} episodes
                                </span>
                            )}
                            {show.episodeRuntime && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={13} /> ~{show.episodeRuntime}m / ep
                                </span>
                            )}
                            {show.language && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Globe size={13} /> {getLanguageName(show.language)}
                                </span>
                            )}
                            {show.networks.length > 0 && (
                                <span>{show.networks.map(n => n.name).join(', ')}</span>
                            )}
                            {show.status && (
                                <span style={{ fontWeight: 700, color: statusColor[show.status] ?? 'var(--text-tertiary)' }}>
                                    {show.status}
                                </span>
                            )}
                        </div>

                        {/* User Rating */}
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 6 }}>
                                {session ? 'Your Rating' : 'Rating'}
                            </p>
                            <div className="rating-picker">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                                    <button
                                        key={star}
                                        className={`rating-star ${star <= (hoverRating || (show.userInteraction.rating ?? 0)) ? 'filled' : ''}`}
                                        onMouseEnter={() => session && setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => handleRate(star)}
                                        disabled={actionLoading === 'rating'}
                                        aria-label={`Rate ${star} out of 10`}
                                        style={{ cursor: session ? 'pointer' : 'default' }}
                                    >
                                        <Star size={22} fill="currentColor" />
                                    </button>
                                ))}
                                <span className="rating-value">
                                    {hoverRating || show.userInteraction.rating || '—'} / 10
                                </span>
                            </div>
                            {!session && (
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                    <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Sign in</Link> to rate this show
                                </p>
                            )}
                        </div>

                        {/* TMDB Rating */}
                        {show.voteAverage > 0 && (
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <StarDisplay value={show.voteAverage} />
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 3 }}>
                                    {show.voteCount.toLocaleString()} TMDB ratings
                                </p>
                            </div>
                        )}

                        {/* Watch prompt after rating */}
                        {showWatchPrompt && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                gap: 'var(--space-md)', flexWrap: 'wrap',
                                padding: '10px 16px',
                                background: 'rgba(0,209,193,0.08)',
                                border: '1px solid rgba(0,209,193,0.25)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-md)',
                            }}>
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Eye size={15} style={{ color: 'var(--brand)' }} />
                                    Mark <strong>{show.title}</strong> as watched?
                                </span>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button
                                        onClick={async () => { setShowWatchPrompt(false); await handleWatchToggle(); }}
                                        disabled={actionLoading === 'watch'}
                                        className="btn btn-primary btn-sm"
                                    >
                                        Yes, mark watched
                                    </button>
                                    <button onClick={() => setShowWatchPrompt(false)} className="btn btn-ghost btn-sm">
                                        No thanks
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
                            <button
                                onClick={handleWatchToggle}
                                disabled={actionLoading === 'watch'}
                                className={show.userInteraction.watched ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                                style={{ gap: 6, minWidth: 130 }}
                            >
                                {show.userInteraction.watched ? <><Check size={15} strokeWidth={3} /> Watched</> : <><Eye size={15} /> Mark Watched</>}
                            </button>

                            {session && show.userInteraction.watched && (
                                <button
                                    onClick={handleRewatch}
                                    disabled={actionLoading === 'rewatch'}
                                    className="btn btn-ghost btn-sm"
                                    style={{ gap: 6, minWidth: 130 }}
                                    title={show.userInteraction.rewatchCount > 0 ? `Rewatched ×${show.userInteraction.rewatchCount}` : 'Mark as rewatched'}
                                >
                                    {actionLoading === 'rewatch'
                                        ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                                        : <RefreshCw size={15} />}
                                    {show.userInteraction.rewatchCount > 0
                                        ? <>Rewatch <span style={{ background: 'var(--brand)', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '1px 7px' }}>×{show.userInteraction.rewatchCount}</span></>
                                        : <>Rewatch</>}
                                </button>
                            )}

                            {!show.userInteraction.watched && (
                                <button
                                    onClick={handleWatchlistToggle}
                                    disabled={actionLoading === 'watchlist'}
                                    className={show.userInteraction.inWatchlist ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                                    style={{ gap: 6, minWidth: 140 }}
                                >
                                    <BookmarkPlus size={15} />
                                    {show.userInteraction.inWatchlist ? 'Saved' : 'Add to Watchlist'}
                                </button>
                            )}

                            {session && (
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={handleOpenListModal}
                                    style={{ gap: 6 }}
                                >
                                    <ListPlus size={15} /> Add to List
                                </button>
                            )}

                            {session && !show.userInteraction.hasReview && (
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    style={{ gap: 6 }}
                                >
                                    <Edit3 size={15} /> Write Review
                                </button>
                            )}

                            {show.trailerKey && (
                                <button onClick={() => setShowTrailer(true)} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
                                    <Play size={14} fill="currentColor" /> Trailer
                                </button>
                            )}
                        </div>

                        {/* Review Form */}
                        {showReviewForm && (
                            <form onSubmit={handleReview} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Write Your Review</h3>
                                <textarea
                                    className="input"
                                    placeholder="What did you think about this show? (min 10 characters)"
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    style={{ width: '100%', minHeight: 120, resize: 'vertical', marginBottom: 'var(--space-md)', boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} />
                                        Contains spoilers
                                    </label>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowReviewForm(false)}>Cancel</button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-sm"
                                            disabled={reviewText.trim().length < 10 || actionLoading === 'review'}
                                        >
                                            {actionLoading === 'review' ? 'Posting…' : 'Post Review'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Overview */}
                        {show.description && (
                            <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.75, color: 'var(--text-secondary)', maxWidth: 640 }}>
                                {show.description}
                            </p>
                        )}

                        {/* Created by */}
                        {show.createdBy.length > 0 && (
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-md)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Created by </span>
                                {show.createdBy.map(c => c.name).join(', ')}
                            </p>
                        )}

                        {/* Next episode */}
                        {show.nextEpisode && (
                            <div style={{ marginTop: 'var(--space-md)', padding: '8px 14px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)' }}>
                                <Calendar size={12} style={{ color: 'var(--brand)' }} />
                                <span><span style={{ fontWeight: 700, color: 'var(--brand)' }}>Next episode:</span> {show.nextEpisode.name} — {new Date(show.nextEpisode.air_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cast */}
                {show.cast.length > 0 && (
                    <section style={{ marginTop: 'var(--space-3xl)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>Cast</h2>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
                            {show.cast.map(person => (
                                <div key={person.id} style={{ flexShrink: 0, width: 90, textAlign: 'center' }}>
                                    <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', background: 'var(--bg-secondary)', border: '2px solid var(--border-default)' }}>
                                        {person.profileUrl ? (
                                            <img src={person.profileUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Users size={28} style={{ opacity: 0.3 }} />
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{person.name}</p>
                                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{person.character}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Seasons */}
                {show.seasons.length > 0 && (
                    <section style={{ marginTop: 'var(--space-3xl)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
                            Seasons <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-tertiary)' }}>({show.seasons.length})</span>
                        </h2>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
                            {show.seasons.map(s => (
                                <div key={s.id} style={{ flexShrink: 0, width: 110 }}>
                                    <div style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', marginBottom: 6 }}>
                                        {s.posterUrl ? (
                                            <img src={s.posterUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Tv size={28} style={{ opacity: 0.3 }} />
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, color: 'var(--text-primary)' }}>{s.name}</p>
                                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.episodeCount} eps</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Reviews */}
                {show.reviews.length > 0 && (
                    <section style={{ marginTop: 'var(--space-3xl)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>Reviews</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {show.reviews.map((review) => {
                                const isOwnReview = session?.user?.id === review.user.id;
                                const isEditing = editingReviewId === review.id;
                                const isConfirmingDelete = confirmDeleteReviewId === review.id;
                                const likes = reviewLikes[review.id] ?? { count: review.likeCount, liked: review.likedByMe };
                                const isSpoilerRevealed = revealedSpoilers.has(review.id);
                                return (
                                    <div key={review.id} className="review-card">
                                        <div className="review-header" style={{ justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                <div className="review-author-avatar">
                                                    {review.user.avatarUrl ? (
                                                        <img src={review.user.avatarUrl} alt={review.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                            {review.user.username.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Link href={`/users/${review.user.username}`} className="review-author-name">{review.user.username}</Link>
                                                        {review.user.role === 'owner' && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 20, boxShadow: '0 1px 4px rgba(245,158,11,0.4)' }}>
                                                                <Crown size={8} /> Owner
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="review-date">
                                                        {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>
                                                {review.containsSpoilers && (
                                                    <span className="review-spoiler-tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <AlertTriangle size={14} /> Spoiler
                                                    </span>
                                                )}
                                            </div>
                                            {isOwnReview && !isEditing && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                    <button onClick={() => { setEditingReviewId(review.id); setEditReviewText(review.content); setEditReviewSpoiler(review.containsSpoilers); setConfirmDeleteReviewId(null); }} title="Edit review"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, borderRadius: 4, display: 'flex', transition: 'color 0.12s' }}
                                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                                                    ><Pencil size={15} /></button>
                                                    {!isConfirmingDelete ? (
                                                        <button onClick={() => setConfirmDeleteReviewId(review.id)} title="Delete review"
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, borderRadius: 4, display: 'flex', transition: 'color 0.12s' }}
                                                            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                                                        ><Trash2 size={15} /></button>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ fontSize: 'var(--text-xs)', color: '#ef4444', fontWeight: 600 }}>Delete?</span>
                                                            <button onClick={() => handleDeleteReview(review.id)} disabled={deletingReviewId === review.id}
                                                                style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#fff', background: '#ef4444', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                                                                {deletingReviewId === review.id ? '…' : 'Yes'}
                                                            </button>
                                                            <button onClick={() => setConfirmDeleteReviewId(null)}
                                                                style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                                                                No
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div style={{ marginTop: 'var(--space-sm)' }}>
                                                <textarea className="input" value={editReviewText} onChange={e => setEditReviewText(e.target.value)}
                                                    style={{ width: '100%', minHeight: 100, resize: 'vertical', marginBottom: 8, boxSizing: 'border-box' }} autoFocus />
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={editReviewSpoiler} onChange={e => setEditReviewSpoiler(e.target.checked)} />
                                                        Contains spoilers
                                                    </label>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingReviewId(null)}>Cancel</button>
                                                        <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveEditReview} disabled={editReviewText.trim().length < 10 || savingEditReview}>
                                                            {savingEditReview ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {review.containsSpoilers && !isSpoilerRevealed ? (
                                                    <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>This review contains spoilers.</span>
                                                        <button onClick={() => setRevealedSpoilers(prev => new Set([...prev, review.id]))}
                                                            style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                            Show anyway
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="review-content" style={{ marginTop: 'var(--space-sm)' }}>{review.content}</p>
                                                )}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'var(--space-sm)' }}>
                                                    <button onClick={() => handleLikeReview(review.id)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: session ? 'pointer' : 'default', color: likes.liked ? '#ef4444' : 'var(--text-tertiary)', fontSize: 'var(--text-xs)', fontWeight: 600, padding: 0, transition: 'color 0.12s' }}>
                                                        <Heart size={14} fill={likes.liked ? 'currentColor' : 'none'} />
                                                        {likes.count > 0 && likes.count}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Similar Shows */}
                {show.similarShows.length > 0 && (
                    <section style={{ marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-3xl)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>Similar Shows</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-sm)' }}>
                            {show.similarShows.map(s => (
                                <Link key={s.id} href={`/shows/${s.id}`} className="movie-card">
                                    {s.posterUrl ? (
                                        <img src={s.posterUrl} alt={s.title} loading="lazy" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 8, textAlign: 'center' }}>
                                            <Tv size={28} style={{ opacity: 0.3 }} />
                                        </div>
                                    )}
                                    <div className="movie-card-overlay">
                                        <div className="movie-card-title">{s.title}</div>
                                        <div className="movie-card-year">{s.year}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Add to List Modal */}
            {showListModal && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}
                    onClick={() => setShowListModal(false)}
                >
                    <div
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: 400 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Add to List</h3>
                            <button onClick={() => setShowListModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={20} /></button>
                        </div>
                        {listsLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)' }}>
                                <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
                            </div>
                        ) : userLists.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                                <p style={{ marginBottom: 'var(--space-md)' }}>You have no lists yet.</p>
                                <a href="/lists" style={{ color: 'var(--brand)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Create a list →</a>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', maxHeight: 320, overflowY: 'auto' }}>
                                {userLists.map((list) => (
                                    <button
                                        key={list.id}
                                        onClick={() => handleAddToList(list.id)}
                                        disabled={addingToListId === list.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px var(--space-md)',
                                            background: listAddedId === list.id ? 'rgba(34,197,94,0.1)' : 'var(--bg-primary)',
                                            border: `1px solid ${listAddedId === list.id ? 'rgba(34,197,94,0.4)' : 'var(--border-default)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                                        }}
                                    >
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 2 }}>{list.title}</p>
                                            {list._count && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{list._count.movies} item{list._count.movies !== 1 ? 's' : ''}</p>}
                                        </div>
                                        {addingToListId === list.id
                                            ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)', flexShrink: 0 }} />
                                            : listAddedId === list.id
                                                ? <Check size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                                                : <ListPlus size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                        }
                                    </button>
                                ))}
                            </div>
                        )}
                        <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-default)' }}>
                            <a href="/lists" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
                                <ListPlus size={15} /> Manage My Lists
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Poster Change Modal */}
            {showPosterModal && (
                <>
                    <div onClick={closePosterModal} style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} />
                    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 440, zIndex: 200, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                        <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <ImagePlus size={18} style={{ color: 'var(--brand)' }} />
                                <h3 style={{ fontWeight: 800, fontSize: 'var(--text-base)', margin: 0 }}>Change Poster</h3>
                            </div>
                            <button onClick={closePosterModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 4 }}><X size={20} /></button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)' }}>
                            {(['pick', 'upload'] as const).map(t => (
                                <button key={t} onClick={() => { setPosterTab(t); setUploadFile(null); setUploadPreview(null); setUploadError(null); }} style={{ flex: 1, padding: '10px', fontSize: 'var(--text-sm)', fontWeight: 600, background: 'none', cursor: 'pointer', borderBottom: posterTab === t ? '2px solid var(--brand)' : '2px solid transparent', marginBottom: -1, color: posterTab === t ? 'var(--text-primary)' : 'var(--text-tertiary)', transition: 'color 0.12s' }}>
                                    {t === 'pick' ? 'Pick from TMDB' : 'Upload Image'}
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: 'var(--space-lg)', flex: 1 }}>
                            {posterTab === 'pick' && (
                                <>
                                    {tmdbPostersLoading && <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-xl)' }}>Loading posters…</p>}
                                    {!tmdbPostersLoading && tmdbPosters.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-xl)' }}>No alternate posters available</p>}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                        {tmdbPosters.map((p, i) => (
                                            <div key={i} style={{ position: 'relative', cursor: 'pointer', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: applyingPoster === p.full ? '2px solid var(--brand)' : '2px solid transparent', transition: 'border-color 0.12s', opacity: applyingPoster && applyingPoster !== p.full ? 0.5 : 1 }}
                                                onClick={() => p.full && handlePickTmdbPoster(p.full)}>
                                                {p.thumb && <img src={p.thumb} alt={`Poster ${i + 1}`} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />}
                                                {applyingPoster === p.full && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div>}
                                            </div>
                                        ))}
                                    </div>
                                    {show.userInteraction.customPosterUrl && (
                                        <button onClick={async () => { await fetch(`/api/shows/${id}/custom-poster`, { method: 'DELETE' }); setShowPosterModal(false); fetchShow(); }}
                                            style={{ marginTop: 'var(--space-lg)', width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #ef444455', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                                            Revert to TMDB Poster
                                        </button>
                                    )}
                                </>
                            )}

                            {posterTab === 'upload' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    {/* Hidden file input */}
                                    <input
                                        ref={uploadInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            e.target.value = '';
                                            if (!file) return;
                                            if (!file.type.startsWith('image/')) { setUploadError('Please select a JPG, PNG or WebP image'); return; }
                                            if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5MB'); return; }
                                            setUploadError(null);
                                            setUploadFile(file);
                                            setUploadPreview(URL.createObjectURL(file));
                                        }}
                                    />

                                    {/* Preview / drop zone */}
                                    <div
                                        style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px dashed var(--border-default)', cursor: 'pointer', background: 'var(--bg-primary)' }}
                                        onClick={() => uploadInputRef.current?.click()}
                                    >
                                        {uploadPreview ? (
                                            <img src={uploadPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-tertiary)' }}>
                                                <ImagePlus size={32} style={{ opacity: 0.4 }} />
                                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Click to choose image</span>
                                                <span style={{ fontSize: 11, opacity: 0.6 }}>JPG, PNG, WebP · max 5MB</span>
                                            </div>
                                        )}
                                        {uploadPreview && (
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'rgba(0,0,0,0.6)', textAlign: 'center', fontSize: 11, color: '#fff' }}>
                                                Click to choose a different image
                                            </div>
                                        )}
                                    </div>

                                    {uploadError && <p style={{ fontSize: 'var(--text-sm)', color: '#ef4444', margin: 0 }}>{uploadError}</p>}

                                    {/* Upload & Apply button */}
                                    <button
                                        disabled={!uploadFile || uploadLoading}
                                        onClick={async () => {
                                            if (!uploadFile) return;
                                            setUploadLoading(true);
                                            setUploadError(null);
                                            try {
                                                const ext = uploadFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
                                                const presignRes = await fetch('/api/uploads/presign', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ type: 'poster', movieId: `show-${id}`, contentType: uploadFile.type, extension: ext }),
                                                });
                                                const presignData = await presignRes.json();
                                                if (!presignData.success) { setUploadError('Failed to get upload URL'); return; }
                                                const putRes = await fetch(presignData.data.uploadUrl, { method: 'PUT', body: uploadFile, headers: { 'Content-Type': uploadFile.type } });
                                                if (!putRes.ok) { setUploadError('Upload failed, please try again'); return; }
                                                const saveRes = await fetch(`/api/shows/${id}/custom-poster`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ posterUrl: presignData.data.publicUrl }),
                                                });
                                                if (!saveRes.ok) { setUploadError('Failed to save poster'); return; }
                                                closePosterModal();
                                                fetchShow();
                                            } catch { setUploadError('Something went wrong, please try again'); }
                                            finally { setUploadLoading(false); }
                                        }}
                                        style={{ padding: '11px', borderRadius: 'var(--radius-md)', background: uploadFile ? 'var(--brand)' : 'var(--bg-tertiary)', color: uploadFile ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: uploadFile ? 'pointer' : 'not-allowed', transition: 'background 0.15s', opacity: uploadLoading ? 0.7 : 1 }}
                                    >
                                        {uploadLoading ? 'Uploading…' : 'Upload & Apply'}
                                    </button>

                                    {show.userInteraction.customPosterUrl && (
                                        <button onClick={async () => { await fetch(`/api/shows/${id}/custom-poster`, { method: 'DELETE' }); closePosterModal(); fetchShow(); }}
                                            style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #ef444455', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                                            Revert to TMDB Poster
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Trailer modal */}
            {showTrailer && show.trailerKey && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}
                    onClick={() => setShowTrailer(false)}
                >
                    <button onClick={() => setShowTrailer(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                        <X size={20} />
                    </button>
                    <div style={{ width: '100%', maxWidth: 900 }} onClick={e => e.stopPropagation()}>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                            <iframe
                                src={`https://www.youtube.com/embed/${show.trailerKey}?autoplay=1`}
                                allow="autoplay; fullscreen"
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', borderRadius: 'var(--radius-xl)' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
