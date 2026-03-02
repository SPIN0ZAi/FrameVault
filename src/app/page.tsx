import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
    getTrendingMovies, getTopRatedMovies, getTMDBImageUrl,
} from '@/lib/tmdb';
import {
    Film, Star, Eye, BookmarkPlus, Users, MessageSquare,
    Trophy, Clock, List as ListIcon, TrendingUp, Flame,
} from 'lucide-react';
import HeroCarousel from '@/components/ui/HeroCarousel';
import PopularSection from '@/components/ui/PopularSection';

// Re-render on every request so random selections rotate
export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeroMovie {
    id: string;
    title: string;
    year: number;
    posterUrl: string | null;
    backdropUrl: string | null;
    description: string;
    averageRating: number | null;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getTrendingSection(): Promise<HeroMovie[]> {
    try {
        const data = await getTrendingMovies();
        return data.results.slice(0, 12).map((m) => ({
            id: m.id.toString(),
            title: m.title,
            year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : 0,
            posterUrl: getTMDBImageUrl(m.poster_path, 'w500'),
            backdropUrl: getTMDBImageUrl(m.backdrop_path, 'original'),
            description: m.overview,
            averageRating: m.vote_average ? parseFloat(m.vote_average.toFixed(1)) : null,
        }));
    } catch { return []; }
}

async function getOscarMovies(): Promise<HeroMovie[]> {
    try {
        const page = Math.ceil(Math.random() * 4);
        const data = await getTopRatedMovies(page);
        const shuffled = [...data.results].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 12).map((m) => ({
            id: m.id.toString(),
            title: m.title,
            year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : 0,
            posterUrl: getTMDBImageUrl(m.poster_path, 'w500'),
            backdropUrl: getTMDBImageUrl(m.backdrop_path, 'original'),
            description: m.overview,
            averageRating: m.vote_average ? parseFloat(m.vote_average.toFixed(1)) : null,
        }));
    } catch { return []; }
}

async function getRecentlyDropped() {
    try {
        const movies = await prisma.movie.findMany({
            orderBy: { createdAt: 'desc' },
            take: 12,
            select: {
                id: true, tmdbId: true, title: true, year: true,
                posterUrl: true, createdAt: true,
                ratings: { select: { value: true } },
            },
        });
        return movies.map((m) => ({
            ...m,
            averageRating: m.ratings.length
                ? parseFloat((m.ratings.reduce((s, r) => s + r.value, 0) / m.ratings.length).toFixed(1))
                : null,
        }));
    } catch { return []; }
}

async function getRecentLists(userId?: string) {
    try {
        let followingIds: string[] = [];
        if (userId) {
            const follows = await prisma.follows.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            });
            followingIds = follows.map((f: { followingId: string }) => f.followingId);
        }
        return prisma.list.findMany({
            where: {
                isPublic: true,
                ...(followingIds.length > 0 ? { userId: { in: followingIds } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 6,
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true,
                        profile: { select: { bannerUrl: true } },
                    },
                },
                movies: { take: 2, orderBy: { position: 'asc' } },
            },
        });
    } catch { return []; }
}

async function getFriendsActivity(userId?: string) {
    try {
        let followingIds: string[] = [];
        if (userId) {
            const follows = await prisma.follows.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            });
            followingIds = follows.map((f: { followingId: string }) => f.followingId);
        }
        const userFilter = followingIds.length > 0 ? { in: followingIds } : undefined;
        const recentReviews = await prisma.review.findMany({
            where: userFilter ? { userId: userFilter } : undefined,
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: { movie: true, user: true },
        });
        return Promise.all(
            recentReviews.map(async (review: any) => {
                const rating = await prisma.rating.findFirst({
                    where: { movieId: review.movieId, userId: review.userId },
                });
                return { ...review, rating: rating?.value ?? null };
            })
        );
    } catch { return []; }
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHead({
    icon, title, subtitle, href, hrefLabel = 'See all →', accentColor = 'var(--brand)',
}: {
    icon: React.ReactNode; title: string; subtitle?: string;
    href?: string; hrefLabel?: string; accentColor?: string;
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `color-mix(in srgb, ${accentColor} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: accentColor }}>{icon}</span>
                </div>
                <div>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h2>
                    {subtitle && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</p>}
                </div>
            </div>
            {href && (
                <Link href={href} className="btn btn-ghost btn-sm" style={{ fontWeight: 600, flexShrink: 0 }}>
                    {hrefLabel}
                </Link>
            )}
        </div>
    );
}

// ─── Horizontal movie scroll ──────────────────────────────────────────────────

function MovieScroll({ movies, badgeColor }: { movies: HeroMovie[]; badgeColor?: string }) {
    return (
        <div style={{
            display: 'flex', gap: 'var(--space-md)',
            overflowX: 'auto', scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            margin: '0 calc(var(--space-lg) * -1)',
            padding: '0 var(--space-lg) var(--space-lg)',
        }}>
            {movies.map((movie, i) => (
                <Link href={`/movies/${movie.id}`} key={movie.id} className="movie-card" style={{ flex: '0 0 160px', cursor: 'pointer' }}>
                    {badgeColor && (
                        <div style={{
                            position: 'absolute', top: 8, left: 8, zIndex: 10,
                            background: badgeColor, color: '#fff',
                            fontWeight: 800, fontSize: 12,
                            width: 26, height: 26, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        }}>{i + 1}</div>
                    )}
                    {movie.posterUrl ? (
                        <img src={movie.posterUrl} alt={movie.title} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center' }}>
                            <Film size={40} style={{ opacity: 0.4, marginBottom: 8 }} />
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{movie.title}</span>
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
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
    const session = await auth();
    const userId = session?.user?.id;

    const [trending, oscarMovies, recentlyDropped, recentLists, friendsActivity] =
        await Promise.all([
            getTrendingSection(),
            getOscarMovies(),
            getRecentlyDropped(),
            getRecentLists(userId),
            getFriendsActivity(userId),
        ]);

    const heroPool = trending.filter((m) => m.backdropUrl && m.description.length > 20);

    return (
        <div style={{ paddingBottom: 'var(--space-3xl)' }}>
            <HeroCarousel movies={heroPool} isLoggedIn={!!session} />

            <div className="container" style={{ position: 'relative', zIndex: 10 }}>

                {/* ── Feature cards ── */}
                <section style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 'var(--space-md)', marginBottom: 'var(--space-3xl)',
                }}>
                    {[
                        { icon: <Eye size={22} />, title: 'Track Every Film', desc: 'Build a complete personal viewing history.' },
                        { icon: <Star size={22} />, title: 'Rate & Review', desc: 'Score films out of 10 and write detailed reviews.' },
                        { icon: <BookmarkPlus size={22} />, title: 'Build a Watchlist', desc: 'Save films so you never forget what to watch next.' },
                        { icon: <Users size={22} />, title: 'Follow Friends', desc: 'See what people you follow are watching and reviewing.' },
                    ].map((f) => (
                        <div key={f.title} style={{
                            display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)',
                            padding: 'var(--space-lg)',
                            background: 'rgba(44, 49, 54, 0.5)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-lg)',
                            backdropFilter: 'blur(12px)',
                        }}>
                            <div style={{ color: 'var(--brand)', marginBottom: 'var(--space-xs)' }}>{f.icon}</div>
                            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{f.title}</h3>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
                        </div>
                    ))}
                </section>

                {/* ── Popular Right Now (client component — truly live) ── */}
                <PopularSection />

                {/* ── Trending This Week ── */}
                {trending.length > 0 && (
                    <section style={{ marginBottom: 'var(--space-3xl)' }}>
                        <SectionHead
                            icon={<TrendingUp size={22} />}
                            title="Trending This Week"
                            subtitle="What the world is watching right now"
                            accentColor="#f59e0b"
                        />
                        <MovieScroll movies={trending} badgeColor="#f59e0b" />
                    </section>
                )}

                {/* ── And the Oscar Goes to... ── */}
                {oscarMovies.length > 0 && (
                    <section style={{ marginBottom: 'var(--space-3xl)' }}>
                        <SectionHead
                            icon={<Trophy size={22} />}
                            title="And the Oscar Goes to…"
                            subtitle="The highest-rated films of all time, randomly selected"
                            accentColor="#d97706"
                        />
                        <MovieScroll movies={oscarMovies} />
                    </section>
                )}

                {/* ── New Lists from Friends / Community ── */}
                {recentLists.length > 0 && (
                    <section style={{ marginBottom: 'var(--space-3xl)' }}>
                        <SectionHead
                            icon={<ListIcon size={22} />}
                            title={userId ? 'New Lists from Friends' : 'Community Lists'}
                            subtitle={userId ? 'Recently created by people you follow' : 'Curated lists from the community'}
                            href="/lists"
                            accentColor="#8b5cf6"
                        />
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: 'var(--space-md)',
                        }}>
                            {recentLists.map((list: any) => (
                                <Link href={`/lists/${list.id}`} key={list.id} style={{
                                    textDecoration: 'none', display: 'flex',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-lg)',
                                    overflow: 'hidden',
                                    transition: 'border-color 0.15s, transform 0.15s',
                                }}>
                                    {/* Stacked poster thumbnails */}
                                    <div style={{ display: 'flex', width: 100, flexShrink: 0 }}>
                                        {list.movies.length > 0
                                            ? list.movies.map((m: any, i: number) => (
                                                <div key={i} style={{ width: 50, height: 100, flexShrink: 0, background: 'var(--bg-tertiary)', overflow: 'hidden', borderRight: '1px solid var(--border-subtle)' }}>
                                                    {m.posterUrl
                                                        ? <img src={m.posterUrl} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={16} style={{ opacity: 0.3 }} /></div>
                                                    }
                                                </div>
                                            ))
                                            : <div style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}><ListIcon size={24} style={{ opacity: 0.3 }} /></div>
                                        }
                                    </div>
                                    {/* Info */}
                                    <div style={{ padding: '12px var(--space-md)', flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                                            {list.title}
                                        </p>
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                                            {list.movies.length} film{list.movies.length !== 1 ? 's' : ''}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {list.user.avatarUrl
                                                ? <img src={list.user.avatarUrl} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                                                : <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#8b5cf6' }}>
                                                    {list.user.username.charAt(0).toUpperCase()}
                                                </div>
                                            }
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>@{list.user.username}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Recently Dropped ── */}
                {recentlyDropped.length > 0 && (
                    <section style={{ marginBottom: 'var(--space-3xl)' }}>
                        <SectionHead
                            icon={<Clock size={22} />}
                            title="Recently Dropped"
                            subtitle="Movies newly added to FrameVault"
                            accentColor="var(--brand)"
                        />
                        <div style={{
                            display: 'flex', gap: 'var(--space-md)',
                            overflowX: 'auto', scrollbarWidth: 'none',
                            WebkitOverflowScrolling: 'touch',
                            margin: '0 calc(var(--space-lg) * -1)',
                            padding: '0 var(--space-lg) var(--space-lg)',
                        }}>
                            {recentlyDropped.map((movie) => {
                                const isNew = (Date.now() - new Date(movie.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
                                return (
                                    <Link href={`/movies/${movie.tmdbId ?? movie.id}`} key={movie.id} className="movie-card" style={{ flex: '0 0 160px', cursor: 'pointer' }}>
                                        {isNew && (
                                            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: 'var(--brand)', color: '#000', fontWeight: 800, fontSize: 10, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>
                                                NEW
                                            </div>
                                        )}
                                        {movie.posterUrl ? (
                                            <img src={movie.posterUrl} alt={movie.title} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center' }}>
                                                <Film size={40} style={{ opacity: 0.4, marginBottom: 8 }} />
                                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{movie.title}</span>
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
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Friends / Global Activity ── */}
                {friendsActivity.length > 0 && (
                    <section style={{ marginBottom: 'var(--space-3xl)' }}>
                        <SectionHead
                            icon={<MessageSquare size={22} />}
                            title={userId && friendsActivity.some((a: any) => a.userId !== userId) ? 'New From Friends' : 'Global Activity'}
                            subtitle="Recent reviews from the community"
                            accentColor="#06b6d4"
                        />
                        <div style={{
                            display: 'flex', gap: 'var(--space-md)',
                            overflowX: 'auto', scrollbarWidth: 'none',
                            WebkitOverflowScrolling: 'touch',
                            margin: '0 calc(var(--space-lg) * -1)',
                            padding: '0 var(--space-lg) var(--space-lg)',
                        }}>
                            {friendsActivity.map((activity: any) => (
                                <Link href={`/movies/${activity.movie.tmdbId ?? activity.movie.id}`} key={activity.id} className="movie-card" style={{ flex: '0 0 200px', cursor: 'pointer' }}>
                                    <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, background: 'rgba(26,29,33,0.85)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                                        <MessageSquare size={13} fill="currentColor" stroke="none" />
                                    </div>
                                    {activity.rating && (
                                        <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, background: '#00e054', color: '#fff', fontWeight: 800, fontSize: 13, padding: '3px 8px', borderBottomLeftRadius: 4 }}>
                                            {(activity.rating / 2).toFixed(1)}
                                        </div>
                                    )}
                                    {activity.movie.posterUrl ? (
                                        <img src={activity.movie.posterUrl} alt={activity.movie.title} style={{ height: 300, width: '100%', objectFit: 'cover', borderRadius: 4 }} />
                                    ) : (
                                        <div style={{ width: '100%', height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 4 }}>
                                            <Film size={48} style={{ opacity: 0.4, marginBottom: 8 }} />
                                        </div>
                                    )}
                                    <div style={{ paddingTop: 12 }}>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activity.movie.title}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 8 }}>{activity.movie.year}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                                            {activity.user.avatarUrl
                                                ? <img src={activity.user.avatarUrl} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                                                : <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                                                    {activity.user.username.charAt(0).toUpperCase()}
                                                </div>
                                            }
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>@{activity.user.username}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── CTA for guests ── */}
                {!session && (
                    <section style={{
                        textAlign: 'center', padding: 'var(--space-3xl)',
                        background: 'linear-gradient(135deg, rgba(0,209,193,0.08) 0%, rgba(139,92,246,0.08) 100%)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-2xl)',
                    }}>
                        <Flame size={36} style={{ color: 'var(--brand)', marginBottom: 16 }} />
                        <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 12 }}>
                            Your film journey starts here.
                        </h2>
                        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
                            Track every film you watch, write reviews, build lists, and discover what your friends love.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/register" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 'var(--text-base)' }}>
                                Create Free Account
                            </Link>
                            <Link href="/movies" className="btn btn-ghost" style={{ padding: '12px 32px', fontSize: 'var(--text-base)' }}>
                                Browse Films
                            </Link>
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}
