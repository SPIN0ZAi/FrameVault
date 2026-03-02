import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getPopularMovies, getTMDBImageUrl } from '@/lib/tmdb';
import { Film, Star, Eye, BookmarkPlus, Users, MessageSquare } from 'lucide-react';
import HeroCarousel from '@/components/ui/HeroCarousel';

interface PopularMovie {
  id: string;
  title: string;
  year: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  description: string;
  averageRating: number | null;
}

async function getPopularTMDBMovies(): Promise<PopularMovie[]> {
  try {
    const data = await getPopularMovies(1);
    return data.results.map(m => ({
      id: m.id.toString(),
      title: m.title,
      year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : 0,
      posterUrl: getTMDBImageUrl(m.poster_path, 'w500'),
      backdropUrl: getTMDBImageUrl(m.backdrop_path, 'original'),
      description: m.overview,
      averageRating: m.vote_average ? parseFloat(m.vote_average.toFixed(1)) : null,
    }));
  } catch {
    return [];
  }
}

async function getFriendsActivity(userId?: string) {
  try {
    let followingIds: string[] = [];

    // If logged in, get the IDs of users they follow
    if (userId) {
      const follows = await prisma.follows.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });
      followingIds = follows.map((f: { followingId: string }) => f.followingId);
    }

    // If they follow nobody, or aren't logged in, we can either return empty 
    // or fallback to global recent activity. Let's fallback to global.
    const userFilter = followingIds.length > 0 ? { in: followingIds } : undefined;

    const recentReviews = await prisma.review.findMany({
      where: userFilter ? { userId: userFilter } : undefined,
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        movie: true,
        user: true,
      },
    });

    // We also need to get the specific rating that user gave that movie
    const activities = await Promise.all(
      recentReviews.map(async (review: any) => {
        const rating = await prisma.rating.findFirst({
          where: {
            movieId: review.movieId,
            userId: review.userId,
          },
        });
        return {
          ...review,
          rating: rating?.value || null,
        };
      })
    );

    return activities;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [tmdbMovies, friendsActivity] = await Promise.all([
    getPopularTMDBMovies(),
    getFriendsActivity(userId),
  ]);
  const heroPool = tmdbMovies.filter(m => m.backdropUrl && m.description.length > 20);
  const movieRow = tmdbMovies.slice(0, 12);

  return (
    <div style={{ paddingBottom: 'var(--space-3xl)' }}>
      {/* Cinematic Hero Carousel */}
      <HeroCarousel movies={heroPool} isLoggedIn={!!session} />

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Feature Highlights */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-3xl)',
        }}>
          {[
            { icon: <Eye size={26} />, title: 'Track Every Film', desc: 'Log every film you watch and build a complete personal viewing history.' },
            { icon: <Star size={26} />, title: 'Rate & Review', desc: 'Score films out of 10 and write detailed reviews for others to read.' },
            { icon: <BookmarkPlus size={26} />, title: 'Build a Watchlist', desc: 'Save films you want to see so you never forget what to watch next.' },
            { icon: <Users size={26} />, title: 'Follow Friends', desc: 'See what people you follow are watching, rating, and reviewing.' },
          ].map((feature) => (
            <div key={feature.title} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
              padding: 'var(--space-lg)',
              background: 'rgba(44, 49, 54, 0.5)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ color: 'var(--brand)', marginBottom: 'var(--space-xs)' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </section>

        {/* New From Friends */}
        {friendsActivity.length > 0 && (
          <section style={{ marginBottom: 'var(--space-3xl)' }}>
            <div className="flex justify-between items-center mb-lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {userId && friendsActivity.length > 0 && friendsActivity.some((a: any) => a.userId !== userId) ? "New From Friends" : "Global Activity"}
              </h2>
            </div>

            {/* Netflix style horizontal scroll */}
            <div style={{
              display: 'flex',
              gap: 'var(--space-md)',
              overflowX: 'auto',
              paddingBottom: 'var(--space-lg)',
              scrollbarWidth: 'none', // Firefox
              WebkitOverflowScrolling: 'touch',
              margin: '0 calc(var(--space-lg) * -1)',
              padding: '0 var(--space-lg) var(--space-lg)',
            }}>
              {friendsActivity.length > 0 && friendsActivity.map((activity: any) => (
                <Link href={`/movies/${activity.movie.tmdbId ?? activity.movie.id}`} key={activity.id} className="movie-card" style={{ flex: '0 0 200px', cursor: 'pointer' }}>
                  {/* Speech Bubble Icon (indicates review) */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    zIndex: 10,
                    background: 'rgba(26, 29, 33, 0.8)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                  }}>
                    <MessageSquare size={14} fill="currentColor" stroke="none" />
                  </div>

                  {/* Rating Badge */}
                  {activity.rating && (
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      right: '0',
                      zIndex: 10,
                      background: '#00e054', // Letterboxd green
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '14px',
                      padding: '4px 8px',
                      borderBottomLeftRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}>
                      {(activity.rating / 2).toFixed(1)}
                    </div>
                  )}

                  {activity.movie.posterUrl ? (
                    <img src={activity.movie.posterUrl} alt={activity.movie.title} style={{ height: '300px', width: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '300px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--bg-secondary)',
                      padding: 'var(--space-md)',
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <Film size={48} style={{ marginBottom: 'var(--space-sm)', opacity: 0.5 }} />
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{activity.movie.title}</span>
                    </div>
                  )}

                  {/* Friend Info Footer */}
                  <div style={{ padding: '12px 0 0 0' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activity.movie.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                      {activity.movie.year}
                    </div>

                    {/* Stars and Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                      <div style={{ display: 'flex', color: '#00e054', gap: '1px' }}>
                        {activity.rating ? (
                          Array.from({ length: Math.floor(activity.rating / 2) }).map((_, i) => (
                            <Star key={i} size={13} fill="currentColor" stroke="none" />
                          ))
                        ) : null}
                        {activity.rating && activity.rating % 2 !== 0 ? (
                          <Star size={13} fill="currentColor" stroke="none" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                        ) : null}
                      </div>
                      <span>
                        {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                      </span>
                    </div>

                    {/* User Profile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                      {activity.user.avatarUrl ? (
                        <img src={activity.user.avatarUrl} alt={activity.user.username} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {activity.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>{activity.user.username}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Popular Right Now — TMDB */}
        {movieRow.length > 0 && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '24px', background: 'var(--brand)', borderRadius: '2px' }} />
                Popular Right Now
              </h2>
              <Link href="/movies" className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}>
                Browse All →
              </Link>
            </div>
            <div style={{
              display: 'flex',
              gap: 'var(--space-md)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              margin: '0 calc(var(--space-lg) * -1)',
              padding: '0 var(--space-lg) var(--space-lg)',
            }}>
              {movieRow.map((movie) => (
                <Link href={`/movies/${movie.id}`} key={movie.id} className="movie-card" style={{ flex: '0 0 160px', cursor: 'pointer' }}>
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--bg-secondary)',
                      padding: 'var(--space-md)',
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                    }}>
                      <Film size={48} style={{ marginBottom: 'var(--space-sm)', opacity: 0.5 }} />
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{movie.title}</span>
                    </div>
                  )}
                  {movie.averageRating && (
                    <div className="movie-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
          </section>
        )}
      </div>
    </div>
  );
}
