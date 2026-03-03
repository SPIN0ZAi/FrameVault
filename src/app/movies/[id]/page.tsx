'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Eye, Edit3, Check, CheckCircle2, BookmarkPlus, AlertTriangle, Star, ImagePlus, X, Play, ListPlus, Loader2, Pencil, Trash2 } from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';

interface MovieDetail {
    id: string;
    title: string;
    year: number;
    posterUrl: string | null;
    backdropUrl: string | null;
    description: string | null;
    genres: { id: string; name: string; slug: string }[];
    runtime: number | null;
    language: string | null;
    country: string | null;
    averageRating: number | null;
    ratingCount: number;
    reviewCount: number;
    watchedCount: number;
    watchlistCount: number;
    director: { id: number; name: string; profileUrl: string | null } | null;
    cast: { id: number; name: string; character: string; profileUrl: string | null }[];
    trailerKey: string | null;
    similarMovies: { id: number; title: string; year: number; posterUrl: string | null }[];
    reviews: {
        id: string;
        content: string;
        containsSpoilers: boolean;
        createdAt: string;
        user: { id: string; username: string; avatarUrl: string | null };
    }[];
    userInteraction: {
        watched: boolean;
        watchlisted: boolean;
        rating: number | null;
        hasReview: boolean;
        customPosterUrl: string | null;
    } | null;
}

function formatRuntime(minutes: number | null): string | null {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

function getLanguageName(code: string | null): string | null {
    if (!code) return null;
    try {
        return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code.toUpperCase();
    } catch {
        return code.toUpperCase();
    }
}

// ─── Rating Histogram Card ────────────────────────────────────────────────────
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
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>RATINGS</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{total.toLocaleString()} {total === 1 ? 'FAN' : 'FANS'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: 64, gap: 3 }}>
                        {counts.map((count, i) => {
                            const h = Math.max(3, Math.round((count / maxCount) * 60));
                            return (
                                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                                    <div
                                        title={`${((i + 1) / 2).toFixed(1)}★  (${i + 1}/10): ${count} rating${count !== 1 ? 's' : ''}`}
                                        style={{ width: '100%', height: h, background: 'rgba(255,255,255,0.13)', borderRadius: '2px 2px 0 0', cursor: 'default', transition: 'background 0.12s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                        <Star size={12} style={{ color: 'var(--star-filled)', opacity: 0.4 }} />
                        <div style={{ display: 'flex', gap: 1 }}>
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="currentColor" style={{ color: 'var(--star-filled)', opacity: 0.7 }} />)}
                        </div>
                    </div>
                </div>
                {avgStars !== null && (
                    <div style={{ flexShrink: 0, textAlign: 'center', paddingBottom: 24 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--star-filled)', lineHeight: 1 }}>{avgStars.toFixed(1)}</div>
                        <div style={{ display: 'flex', gap: 2, marginTop: 4, justifyContent: 'center' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={11} fill={avgStars >= i ? 'currentColor' : 'none'} stroke="currentColor"
                                    style={{ color: 'var(--star-filled)', opacity: avgStars >= i - 0.5 ? 1 : 0.3 }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Friends Activity Row ─────────────────────────────────────────────────────
function FriendsActivityRow({
    watched, watchlisted,
}: {
    watched: { user: { id: string; username: string; avatarUrl: string | null }; rating: number | null }[];
    watchlisted: { user: { id: string; username: string; avatarUrl: string | null } }[];
}) {
    const all: { user: { id: string; username: string; avatarUrl: string | null }; rating: number | null; watchlistOnly: boolean }[] = [
        ...watched.map(w => ({ ...w, watchlistOnly: false })),
        ...watchlisted.map(w => ({ user: w.user, rating: null, watchlistOnly: true })),
    ];
    if (all.length === 0) return null;
    return (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'thin' as const }}>
            {all.map(item => {
                const stars = item.rating !== null ? Math.round((item.rating / 10) * 5 * 2) / 2 : 0;
                return (
                    <Link key={item.user.id} href={`/users/${item.user.username}`}
                        style={{ flexShrink: 0, textAlign: 'center', textDecoration: 'none', color: 'inherit', width: 60 }}>
                        <div style={{ position: 'relative', width: 54, height: 54, margin: '0 auto 5px' }}>
                            <div style={{ width: 54, height: 54, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
                                {item.user.avatarUrl
                                    ? <img src={item.user.avatarUrl} alt={item.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--text-tertiary)' }}>{item.user.username.charAt(0).toUpperCase()}</div>
                                }
                            </div>
                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-primary)', border: '1.5px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.watchlistOnly
                                    ? <BookmarkPlus size={9} style={{ color: 'var(--brand)' }} />
                                    : <Eye size={9} style={{ color: 'var(--brand)' }} />
                                }
                            </div>
                        </div>
                        <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.user.username}
                        </p>
                        <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={9}
                                    fill={!item.watchlistOnly && stars >= i ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    style={{ color: 'var(--star-filled)', opacity: !item.watchlistOnly && stars >= i - 0.5 ? 1 : 0.2 }}
                                />
                            ))}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

export default function MovieDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: session } = useSession();
    const router = useRouter();
    const [movie, setMovie] = useState<MovieDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoverRating, setHoverRating] = useState(0);
    const [actionLoading, setActionLoading] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [spoiler, setSpoiler] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showPosterModal, setShowPosterModal] = useState(false);
    const [showTrailerModal, setShowTrailerModal] = useState(false);
    const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
    const [showListModal, setShowListModal] = useState(false);
    const [userLists, setUserLists] = useState<{ id: string; title: string; _count?: { movies: number } }[]>([]);
    const [listsLoading, setListsLoading] = useState(false);
    const [addingToListId, setAddingToListId] = useState<string | null>(null);
    const [listAddedId, setListAddedId] = useState<string | null>(null);
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editReviewText, setEditReviewText] = useState('');
    const [editReviewSpoiler, setEditReviewSpoiler] = useState(false);
    const [savingEditReview, setSavingEditReview] = useState(false);
    const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null);
    const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
    const [ratingHistogram, setRatingHistogram] = useState<{ counts: number[]; average: number | null; total: number } | null>(null);
    const [friendsActivity, setFriendsActivity] = useState<{
        watched: { user: { id: string; username: string; avatarUrl: string | null }; rating: number | null }[];
        watchlisted: { user: { id: string; username: string; avatarUrl: string | null } }[];
    } | null>(null);

    const fetchMovie = useCallback(async () => {
        try {
            const res = await fetch(`/api/movies/${id}`);
            const data = await res.json();
            if (data.success) {
                setMovie(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch movie:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchMovie();
    }, [fetchMovie]);

    useEffect(() => {
        fetch(`/api/movies/${id}/rating-histogram`)
            .then(r => r.json())
            .then(d => { if (d.success) setRatingHistogram(d.data); })
            .catch(() => {});
    }, [id]);

    useEffect(() => {
        if (!session) return;
        fetch(`/api/movies/${id}/friends-activity`)
            .then(r => r.json())
            .then(d => { if (d.success) setFriendsActivity(d.data); })
            .catch(() => {});
    }, [id, session]);

    const handleWatch = async () => {
        if (!session) { router.push('/login'); return; }
        setActionLoading('watch');
        try {
            const isWatched = movie?.userInteraction?.watched;
            await fetch(`/api/watched/${id}`, { method: isWatched ? 'DELETE' : 'POST' });
            await fetchMovie();
        } finally {
            setActionLoading('');
        }
    };

    const handleWatchlist = async () => {
        if (!session) { router.push('/login'); return; }
        setActionLoading('watchlist');
        try {
            const isWatchlisted = movie?.userInteraction?.watchlisted;
            await fetch(`/api/watchlist/${id}`, { method: isWatchlisted ? 'DELETE' : 'POST' });
            await fetchMovie();
        } finally {
            setActionLoading('');
        }
    };

    const handleRate = async (value: number) => {
        if (!session) { router.push('/login'); return; }
        setActionLoading('rating');
        try {
            if (movie?.userInteraction?.rating === value) {
                await fetch(`/api/movies/${id}/rating`, { method: 'DELETE' });
            } else {
                await fetch(`/api/movies/${id}/rating`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value }),
                });
            }
            await fetchMovie();
        } finally {
            setActionLoading('');
        }
    };

    const handleReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) { router.push('/login'); return; }
        if (reviewText.trim().length < 10) return;

        setActionLoading('review');
        try {
            const res = await fetch(`/api/movies/${id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: reviewText, containsSpoilers: spoiler }),
            });
            if (res.ok) {
                setReviewText('');
                setSpoiler(false);
                setShowReviewForm(false);
                await fetchMovie();
            }
        } finally {
            setActionLoading('');
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
        if (!movie) return;
        setAddingToListId(listId);
        await fetch(`/api/lists/${listId}/movies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tmdbId: Number(id),
                title: movie.title,
                year: movie.year,
                posterUrl: movie.userInteraction?.customPosterUrl || movie.posterUrl,
            }),
        });
        setAddingToListId(null);
        setListAddedId(listId);
        setTimeout(() => setListAddedId(null), 2000);
    };

    const handleSaveEditReview = async () => {
        if (!editingReviewId || editReviewText.trim().length < 10) return;
        setSavingEditReview(true);
        try {
            const res = await fetch(`/api/reviews/${editingReviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editReviewText.trim(), containsSpoilers: editReviewSpoiler }),
            });
            if (res.ok) { setEditingReviewId(null); await fetchMovie(); }
        } finally { setSavingEditReview(false); }
    };

    const handleDeleteReview = async (reviewId: string) => {
        setDeletingReviewId(reviewId);
        try {
            const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
            if (res.ok) { setConfirmDeleteReviewId(null); await fetchMovie(); }
        } finally { setDeletingReviewId(null); }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="movie-detail">
                        <div className="skeleton" style={{ aspectRatio: '2/3' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div className="skeleton" style={{ height: '48px', width: '60%' }} />
                            <div className="skeleton" style={{ height: '20px', width: '30%' }} />
                            <div className="skeleton" style={{ height: '100px' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="page">
                <div className="container" style={{ textAlign: 'center' }}>
                    <h1 className="page-title">Movie Not Found</h1>
                    <p className="page-subtitle mt-md">This movie doesn&apos;t exist or has been removed.</p>
                    <Link href="/movies" className="btn btn-primary mt-lg">Browse Movies</Link>
                </div>
            </div>
        );
    }

    const userRating = movie.userInteraction?.rating || 0;
    const runtime = formatRuntime(movie.runtime);
    const languageName = getLanguageName(movie.language);

    return (
        <>
            {/* Backdrop Hero */}
            {movie.backdropUrl && (
                <div style={{ position: 'relative', width: '100%', height: '420px', overflow: 'hidden', marginTop: '-80px' }}>
                    <img
                        src={movie.backdropUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }}
                    />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to bottom, rgba(26,29,33,0) 0%, #1A1D21 88%)',
                    }} />
                </div>
            )}

            <div className="page" style={{
                marginTop: movie.backdropUrl ? '-200px' : undefined,
                position: 'relative',
                zIndex: 1,
            }}>
                <div className="container">
                    <div className="movie-detail">
                    {/* Poster */}
                    <div className="movie-poster-wrapper relative group">
                        {movie.userInteraction?.customPosterUrl || movie.posterUrl ? (
                            <img src={movie.userInteraction?.customPosterUrl || movie.posterUrl!} alt={movie.title} />
                        ) : (
                            <div style={{
                                width: '100%', height: '100%',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-tertiary)',
                            }}>
                                <Film size={64} style={{ opacity: 0.5 }} />
                            </div>
                        )}

                        {/* Edit Poster Overlay for Authenticated Users */}
                        {session && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-[var(--radius-lg)]">
                                <button
                                    onClick={() => setShowPosterModal(true)}
                                    className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--background)] font-bold py-2 px-4 rounded-full transition-colors flex items-center gap-2"
                                >
                                    <ImagePlus size={18} />
                                    Change Poster
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="movie-info">
                        <div>
                            <h1 className="movie-title">{movie.title}</h1>
                            <div className="movie-meta mt-sm">
                                        <span>{movie.year}</span>
                                        {runtime && <span>{runtime}</span>}
                                        {languageName && <span>{languageName}</span>}
                                        {movie.country && <span>{movie.country}</span>}
                                        {movie.genres.length > 0 && (
                                            <div className="movie-genres">
                                                {movie.genres.map((g) => (
                                                    <span key={g.id} className="badge badge-brand">{g.name}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {movie.director && (
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                                            Directed by{' '}
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {movie.director.name}
                                            </span>
                                        </p>
                                    )}
                        </div>

                        {/* Stats */}
                        <div className="movie-stats">
                            <div className="movie-stat">
                                <div className="movie-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {movie.averageRating ? <><Star size={24} fill="currentColor" className="text-brand" /> {movie.averageRating}</> : '—'}
                                </div>
                                <div className="movie-stat-label">
                                    {movie.ratingCount} {movie.ratingCount === 1 ? 'rating' : 'ratings'}
                                </div>
                            </div>
                            <div className="movie-stat">
                                <div className="movie-stat-value">{movie.watchedCount}</div>
                                <div className="movie-stat-label">watched</div>
                            </div>
                            <div className="movie-stat">
                                <div className="movie-stat-value">{movie.reviewCount}</div>
                                <div className="movie-stat-label">reviews</div>
                            </div>
                        </div>

                        {movie.description && (
                            <p className="movie-description">{movie.description}</p>
                        )}

                        {/* Action buttons */}
                        <div className="movie-actions">
                            <button
                                className={`btn ${movie.userInteraction?.watched ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={handleWatch}
                                disabled={actionLoading === 'watch'}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                id="watch-button"
                            >
                                {movie.userInteraction?.watched ? (
                                    <><CheckCircle2 size={18} /> Watched</>
                                ) : (
                                    <><Eye size={18} /> Mark as Watched</>
                                )}
                            </button>
                            <button
                                className={`btn ${movie.userInteraction?.watchlisted ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={handleWatchlist}
                                disabled={actionLoading === 'watchlist'}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                id="watchlist-button"
                            >
                                {movie.userInteraction?.watchlisted ? (
                                    <><Check size={18} /> In Watchlist</>
                                ) : (
                                    <><BookmarkPlus size={18} /> Watchlist</>
                                )}
                            </button>
                            {session && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleOpenListModal}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <ListPlus size={18} /> Add to List
                                </button>
                            )}
                            {session && !movie.userInteraction?.hasReview && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    id="write-review-button"
                                >
                                    <Edit3 size={18} /> Write Review
                                </button>
                            )}
                            {movie.trailerKey && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowTrailerModal(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Play size={18} /> Watch Trailer
                                </button>
                            )}
                        </div>

                        {/* Rating */}
                        <div>
                            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                                Your Rating
                            </h3>
                            <div className="rating-picker">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                    <button
                                        key={star}
                                        className={`rating-star ${star <= (hoverRating || userRating) ? 'filled' : ''}`}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => handleRate(star)}
                                        disabled={actionLoading === 'rating'}
                                        aria-label={`Rate ${star} out of 10`}
                                    >
                                        <Star size={24} fill="currentColor" />
                                    </button>
                                ))}
                                <span className="rating-value">
                                    {hoverRating || userRating || '—'} / 10
                                </span>
                            </div>
                        </div>

                        {/* Review Form */}
                        {showReviewForm && (
                            <form onSubmit={handleReview} className="card" style={{ marginTop: 'var(--space-md)' }}>
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                                    Write Your Review
                                </h3>
                                <textarea
                                    className="input textarea"
                                    placeholder="What did you think about this movie? (min 10 characters)"
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    style={{ minHeight: '150px', marginBottom: 'var(--space-md)' }}
                                    id="review-textarea"
                                />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={spoiler}
                                            onChange={(e) => setSpoiler(e.target.checked)}
                                        />
                                        Contains spoilers
                                    </label>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowReviewForm(false)}>
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-sm"
                                            disabled={reviewText.trim().length < 10 || actionLoading === 'review'}
                                            id="submit-review"
                                        >
                                            {actionLoading === 'review' ? 'Posting...' : 'Post Review'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Activity from Friends */}
                {session && friendsActivity && (friendsActivity.watched.length > 0 || friendsActivity.watchlisted.length > 0) && (
                    <section style={{ marginTop: 'var(--space-3xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>ACTIVITY FROM FRIENDS</h2>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                {friendsActivity.watched.length > 0 && `${friendsActivity.watched.length} WATCHED`}
                                {friendsActivity.watched.length > 0 && friendsActivity.watchlisted.length > 0 && ' \u2022 '}
                                {friendsActivity.watchlisted.length > 0 && `${friendsActivity.watchlisted.length} WANT${friendsActivity.watchlisted.length === 1 ? 'S' : ''} TO WATCH`}
                            </span>
                        </div>
                        <FriendsActivityRow watched={friendsActivity.watched} watchlisted={friendsActivity.watchlisted} />
                    </section>
                )}

                {/* Site-wide Rating Distribution */}
                {ratingHistogram && ratingHistogram.total > 0 && (
                    <section style={{ marginTop: 'var(--space-3xl)' }}>
                        <div style={{ maxWidth: 340 }}>
                            <RatingHistogramCard counts={ratingHistogram.counts} average={ratingHistogram.average} total={ratingHistogram.total} />
                        </div>
                    </section>
                )}

                {/* Cast & Crew */}
                {movie.cast.length > 0 && (
                    <section style={{ marginTop: 'var(--space-3xl)' }}>
                        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
                            Cast &amp; Crew
                        </h2>
                        <div style={{ display: 'flex', gap: 'var(--space-lg)', overflowX: 'auto', paddingBottom: 'var(--space-md)', scrollbarWidth: 'thin' }}>
                            {movie.cast.map((actor) => (
                                <div key={actor.id} style={{ flexShrink: 0, width: '90px', textAlign: 'center' }}>
                                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', background: 'var(--bg-secondary)', border: '2px solid var(--border-default)' }}>
                                        {actor.profileUrl ? (
                                            <img src={actor.profileUrl} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'var(--text-tertiary)' }}>
                                                {actor.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, lineHeight: 1.3, marginBottom: '2px' }}>{actor.name}</p>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.3 }}>{actor.character}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Reviews section */}
                {movie.reviews.length > 0 && (
                    <section style={{ marginTop: 'var(--space-3xl)' }}>
                        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
                            Reviews
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {movie.reviews.map((review) => {
                                const isOwnReview = session?.user?.id === review.user.id;
                                const isEditing = editingReviewId === review.id;
                                const isConfirmingDelete = confirmDeleteReviewId === review.id;
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
                                                <Link href={`/users/${review.user.username}`} className="review-author-name">
                                                    {review.user.username}
                                                </Link>
                                                <div className="review-date">
                                                    {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                            {review.containsSpoilers && (
                                                <span className="review-spoiler-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <AlertTriangle size={14} /> Spoiler
                                                </span>
                                            )}
                                        </div>
                                        {/* Edit / Delete controls for own review */}
                                        {isOwnReview && !isEditing && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                <button
                                                    onClick={() => { setEditingReviewId(review.id); setEditReviewText(review.content); setEditReviewSpoiler(review.containsSpoilers); setConfirmDeleteReviewId(null); }}
                                                    title="Edit review"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, borderRadius: 4, display: 'flex', transition: 'color 0.12s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                                                ><Pencil size={15} /></button>
                                                {!isConfirmingDelete
                                                    ? <button
                                                        onClick={() => setConfirmDeleteReviewId(review.id)}
                                                        title="Delete review"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, borderRadius: 4, display: 'flex', transition: 'color 0.12s' }}
                                                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                                                    ><Trash2 size={15} /></button>
                                                    : <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>Delete?</span>
                                                        <button onClick={() => handleDeleteReview(review.id)} disabled={deletingReviewId === review.id}
                                                            style={{ background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                                                            {deletingReviewId === review.id ? '\u2026' : 'Yes'}
                                                        </button>
                                                        <button onClick={() => setConfirmDeleteReviewId(null)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '3px 6px', fontSize: 11 }}>No</button>
                                                    </div>
                                                }
                                            </div>
                                        )}
                                    </div>
                                    {/* Inline edit form */}
                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                            <textarea
                                                className="input textarea"
                                                value={editReviewText}
                                                onChange={e => setEditReviewText(e.target.value)}
                                                autoFocus
                                                style={{ minHeight: 120, resize: 'vertical' }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={editReviewSpoiler} onChange={e => setEditReviewSpoiler(e.target.checked)} />
                                                    Contains spoilers
                                                </label>
                                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingReviewId(null)}>Cancel</button>
                                                    <button type="button" className="btn btn-primary btn-sm"
                                                        disabled={editReviewText.trim().length < 10 || savingEditReview}
                                                        onClick={handleSaveEditReview}>
                                                        {savingEditReview ? 'Saving\u2026' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className={`review-content ${review.containsSpoilers && !revealedSpoilers.has(review.id) ? 'blurred' : ''}`}
                                                onClick={() => { if (review.containsSpoilers && !revealedSpoilers.has(review.id)) setRevealedSpoilers(new Set([...revealedSpoilers, review.id])); }}
                                            >
                                                {review.content}
                                            </div>
                                            {review.containsSpoilers && !revealedSpoilers.has(review.id) && (
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>Click to reveal spoiler</p>
                                            )}
                                        </>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    </section>
                )}
                {/* Similar Movies */}
                {movie.similarMovies.length > 0 && (
                    <section style={{ marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-3xl)' }}>
                        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
                            More Like This
                        </h2>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-md)', scrollbarWidth: 'thin' }}>
                            {movie.similarMovies.map((m) => (
                                <Link
                                    key={m.id}
                                    href={`/movies/${m.id}`}
                                    style={{ flexShrink: 0, width: '120px', textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{ width: '120px', aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', marginBottom: '8px' }}>
                                        {m.posterUrl && (
                                            <img src={m.posterUrl} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, lineHeight: 1.3, marginBottom: '2px' }}>{m.title}</p>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{m.year}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Upload Poster Modal */}
            {showPosterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-light)] border border-[var(--border)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
                            <h3 className="font-bold text-lg">Custom Poster</h3>
                            <button onClick={() => setShowPosterModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <ImageUploader
                                type="poster"
                                movieId={movie.id}
                                label="Upload Custom Artwork"
                                aspectRatio="poster"
                                currentImageUrl={movie.userInteraction?.customPosterUrl || movie.posterUrl || undefined}
                                onFileSelect={async (file) => {
                                    const ext = file.name.split('.').pop() ?? 'jpg';
                                    const presignRes = await fetch('/api/uploads/presign', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ type: 'poster', movieId: movie.id, contentType: file.type, extension: ext }),
                                    });
                                    const presignData = await presignRes.json();
                                    if (!presignData.success) return;
                                    await fetch(presignData.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
                                    await fetch(`/api/movies/${movie.id}/custom-poster`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ posterUrl: presignData.data.publicUrl }),
                                    });
                                    setShowPosterModal(false);
                                    fetchMovie();
                                }}
                            />

                            {movie.userInteraction?.customPosterUrl && (
                                <button
                                    onClick={async () => {
                                        await fetch(`/api/movies/${movie.id}/custom-poster`, { method: 'DELETE' });
                                        setShowPosterModal(false);
                                        fetchMovie();
                                    }}
                                    className="w-full mt-4 text-sm text-red-400 hover:text-red-300 transition-colors py-2"
                                >
                                    Remove Custom Poster
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Trailer Modal */}
        {showTrailerModal && movie.trailerKey && (
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.95)',
                }}
                onClick={() => setShowTrailerModal(false)}
            >
                <button
                    onClick={() => setShowTrailerModal(false)}
                    style={{
                        position: 'absolute', top: '20px', right: '20px',
                        color: 'white', background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '50%', width: '44px', height: '44px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <X size={24} />
                </button>
                <div
                    style={{ width: 'min(90vw, 900px)', aspectRatio: '16/9' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <iframe
                        src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
                        style={{ width: '100%', height: '100%', border: 'none', borderRadius: 'var(--radius-lg)' }}
                        allow="autoplay; fullscreen"
                        allowFullScreen
                    />
                </div>
            </div>
        )}

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
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 2 }}>{list.title}</p>
                                        {list._count && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{list._count.movies} film{list._count.movies !== 1 ? 's' : ''}</p>}
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
        </>
    );
}
