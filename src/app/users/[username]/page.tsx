'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Film, Star, MapPin, Calendar, BookmarkPlus, MessageSquare, Eye, Users, List, Globe, Lock } from 'lucide-react';

//  Types 

interface UserProfile {
    id: string;
    username: string;
    avatarUrl: string | null;
    createdAt: string;
    averageRating: number | null;
    isFollowing?: boolean;
    profile: {
        bio: string | null;
        location: string | null;
        bannerUrl: string | null;
        themeColor: string;
    } | null;
    _count: {
        watchedMovies: number;
        watchlist: number;
        reviews: number;
        ratings: number;
        followers: number;
        following: number;
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
    movie: { id: string; tmdbId: number | null; title: string; year: number; posterUrl: string | null };
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

function StarRating({ value }: { value: number }) {
    const stars = Math.round((value / 10) * 5 * 2) / 2;
    return (
        <div style={{ display: 'flex', gap: '2px', color: 'var(--star-filled)' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={13} fill={stars >= i ? 'currentColor' : 'none'} stroke="currentColor" style={{ opacity: stars >= i - 0.5 ? 1 : 0.25 }} />
            ))}
        </div>
    );
}

function EmptyTab({ icon, text, cta }: { icon: React.ReactNode; text: string; cta?: { label: string; href: string } }) {
    return (
        <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
            <div style={{ margin: '0 auto var(--space-md)', opacity: 0.3 }}>{icon}</div>
            <p style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{text}</p>
            {cta && <Link href={cta.href} className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)', display: 'inline-flex' }}>{cta.label}</Link>}
        </div>
    );
}

function ReviewCard({ review, revealed, onReveal }: { review: Review; revealed: boolean; onReveal: () => void }) {
    const href = `/movies/${review.movie.tmdbId ?? review.movie.id}`;
    return (
        <div style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <Link href={href} style={{ flexShrink: 0, width: '64px' }}>
                {review.movie.posterUrl ? (
                    <img src={review.movie.posterUrl} alt={review.movie.title} style={{ width: '64px', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                ) : (
                    <div style={{ width: '64px', aspectRatio: '2/3', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Film size={20} style={{ opacity: 0.4 }} />
                    </div>
                )}
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                    <div>
                        <Link href={href} style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{review.movie.title}</Link>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginLeft: '6px' }}>{review.movie.year}</span>
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
                {review.rating && <div style={{ marginBottom: 'var(--space-xs)' }}><StarRating value={review.rating} /></div>}
                {review.containsSpoilers && !revealed ? (
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

//  Main Page 

export default function UserProfilePage() {
    const { username } = useParams<{ username: string }>();
    const { data: session } = useSession();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<'not_found' | 'server_error' | null>(null);
    const [activeTab, setActiveTab] = useState<'Profile' | 'Films' | 'Reviews' | 'Watchlist' | 'Lists' | 'Network'>('Profile');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
    const [allFilms, setAllFilms] = useState<WatchedMovie[]>([]);
    const [allFilmsLoaded, setAllFilmsLoaded] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoaded, setReviewsLoaded] = useState(false);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [watchlistLoaded, setWatchlistLoaded] = useState(false);
    const [network, setNetwork] = useState<{ followers: NetworkUser[]; following: NetworkUser[] } | null>(null);
    const [networkLoaded, setNetworkLoaded] = useState(false);
    const [networkTab, setNetworkTab] = useState<'followers' | 'following'>('followers');
    const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
    const [userLists, setUserLists] = useState<UserList[]>([]);
    const [listsLoaded, setListsLoaded] = useState(false);

    const isOwnProfile = session?.user?.username === username;
    const TABS = ['Profile', 'Films', 'Reviews', 'Watchlist', 'Lists', 'Network'] as const;
    const accent = user?.profile?.themeColor || 'var(--brand)';

    useEffect(() => {
        async function fetchProfile() {
            try {
                const [userRes, watchedRes] = await Promise.all([
                    fetch(`/api/users/${username}`),
                    fetch(`/api/users/${username}/watched?limit=8`),
                ]);
                const userData = await userRes.json();
                const watchedData = await watchedRes.json();
                if (userData.success) {
                    setUser(userData.data);
                    setIsFollowing(userData.data.isFollowing || false);
                } else if (userRes.status === 404) {
                    setError('not_found');
                } else {
                    setError('server_error');
                }
                if (watchedData.success) setWatchedMovies(watchedData.data);
            } catch {
                setError('server_error');
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [username]);

    useEffect(() => {
        if (activeTab === 'Films' && !allFilmsLoaded) {
            fetch(`/api/users/${username}/watched?limit=200`)
                .then(r => r.json())
                .then(d => { if (d.success) setAllFilms(d.data); setAllFilmsLoaded(true); });
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
    }, [activeTab, username, allFilmsLoaded, reviewsLoaded, watchlistLoaded, networkLoaded]);

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
                    <img src={user.profile.bannerUrl} alt="banner" />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accent}44 0%, var(--bg-secondary) 100%)` }} />
                )}
                <div className="profile-banner-gradient" />
            </div>

            <div className="container">
                <div className="profile-header">
                    <div className="profile-avatar" style={{ border: '4px solid var(--bg-primary)' }}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.username} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, background: `${accent}22`, color: accent }}>
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="profile-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                            <h1 className="profile-username">{user.username}</h1>
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
                        { value: user._count.ratings, label: 'Ratings', icon: <Star size={14} />, tab: 'Films' as const },
                        { value: user._count.reviews, label: 'Reviews', icon: <MessageSquare size={14} />, tab: 'Reviews' as const },
                        { value: user._count.watchlist, label: 'Watchlist', icon: <BookmarkPlus size={14} />, tab: 'Watchlist' as const },
                        { value: user._count.followers, label: 'Followers', icon: <Users size={14} />, tab: 'Network' as const, sub: 'followers' as const },
                        { value: user._count.following ?? 0, label: 'Following', icon: <Users size={14} />, tab: 'Network' as const, sub: 'following' as const },
                    ] as const).map((stat, idx, arr) => (
                        <button key={stat.label}
                            onClick={() => { setActiveTab(stat.tab); if ('sub' in stat && stat.sub) setNetworkTab(stat.sub); }}
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
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap', color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: activeTab === tab ? `2px solid ${accent}` : '2px solid transparent', marginBottom: '-1px', background: 'none', cursor: 'pointer', transition: 'color var(--duration-fast)' }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'Profile' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3xl)' }}>
                        {watchedMovies.length > 0 && (
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Recent Films</h2>
                                    {user._count.watchedMovies > 8 && (
                                        <button onClick={() => setActiveTab('Films')} style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 600, background: 'none', cursor: 'pointer' }}>View all</button>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-sm)' }}>
                                    {watchedMovies.map(wm => (
                                        <MoviePosterCard key={wm.id} href={`/movies/${wm.movie.tmdbId ?? wm.movie.id}`} posterUrl={wm.movie.customPosters?.[0]?.posterUrl ?? wm.movie.posterUrl} title={wm.movie.title} year={wm.movie.year} />
                                    ))}
                                </div>
                            </section>
                        )}
                        {user._count.reviews > 0 && (
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Recent Reviews</h2>
                                    <button onClick={() => setActiveTab('Reviews')} style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 600, background: 'none', cursor: 'pointer' }}>View all</button>
                                </div>
                                <RecentReviewsPreview username={username} onViewAll={() => setActiveTab('Reviews')} />
                            </section>
                        )}
                        {watchedMovies.length === 0 && user._count.reviews === 0 && (
                            <EmptyTab icon={<Film size={48} />} text="No activity yet" cta={isOwnProfile ? { label: 'Browse Films', href: '/movies' } : undefined} />
                        )}
                    </div>
                )}

                {activeTab === 'Films' && (
                    <div>
                        {!allFilmsLoaded ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-sm)' }}>
                                {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />)}
                            </div>
                        ) : allFilms.length === 0 ? (
                            <EmptyTab icon={<Eye size={48} />} text="No films logged yet" cta={isOwnProfile ? { label: 'Browse Films', href: '/movies' } : undefined} />
                        ) : (
                            <>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>{allFilms.length} film{allFilms.length !== 1 ? 's' : ''} watched</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-sm)' }}>
                                    {allFilms.map(wm => (
                                        <MoviePosterCard key={wm.id} href={`/movies/${wm.movie.tmdbId ?? wm.movie.id}`} posterUrl={wm.movie.customPosters?.[0]?.posterUrl ?? wm.movie.posterUrl} title={wm.movie.title} year={wm.movie.year} />
                                    ))}
                                </div>
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
                                        <ReviewCard key={review.id} review={review} revealed={revealedSpoilers.has(review.id)} onReveal={() => setRevealedSpoilers(prev => new Set([...prev, review.id]))} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'Watchlist' && (
                    <div>
                        {!watchlistLoaded ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-sm)' }}>
                                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />)}
                            </div>
                        ) : watchlist.length === 0 ? (
                            <EmptyTab icon={<BookmarkPlus size={48} />} text="Watchlist is empty" cta={isOwnProfile ? { label: 'Browse Films', href: '/movies' } : undefined} />
                        ) : (
                            <>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>{watchlist.length} film{watchlist.length !== 1 ? 's' : ''} saved</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-sm)' }}>
                                    {watchlist.map(item => (
                                        <MoviePosterCard key={item.id} href={`/movies/${item.movie.tmdbId ?? item.movie.id}`} posterUrl={item.movie.posterUrl} title={item.movie.title} year={item.movie.year} />
                                    ))}
                                </div>
                            </>
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
            </div>
        </div>
    );
}