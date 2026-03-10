import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';
import { getMovieDetails, getMovieCredits, getMovieVideos, getSimilarMovies, getTMDBImageUrl } from '@/lib/tmdb';

// GET /api/movies/[id] — get movie details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        let tmdbMovie;
        try {
            tmdbMovie = await getMovieDetails(id);
        } catch (e) {
            return notFoundError('Movie not found on TMDB');
        }

        // Fetch credits, videos and similar movies in parallel
        const [credits, videos, similar] = await Promise.all([
            getMovieCredits(id).catch(() => ({ cast: [], crew: [] })),
            getMovieVideos(id).catch(() => ({ results: [] })),
            getSimilarMovies(id).catch(() => ({ results: [] })),
        ]);

        // Find director
        const director = credits.crew.find((c) => c.job === 'Director') ?? null;

        // Get top cast (up to 8)
        const cast = credits.cast.slice(0, 8).map((c) => ({
            id: c.id,
            name: c.name,
            character: c.character,
            profileUrl: getTMDBImageUrl(c.profile_path, 'w185'),
        }));

        // Find best trailer key
        const trailer =
            videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
            videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ??
            videos.results.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ??
            null;

        // Similar movies (up to 12)
        const similarMovies = similar.results.slice(0, 12).map((m) => ({
            id: m.id,
            title: m.title,
            year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : 0,
            posterUrl: getTMDBImageUrl(m.poster_path, 'w500'),
        }));

        // We fetch the local movie by tmdbId to get aggregated ratings and review comments, if it has been saved before.
        const localMovie = await prisma.movie.findUnique({
            where: { tmdbId: parseInt(id) },
            include: {
                ratings: { select: { value: true, userId: true } },
                reviews: {
                    include: {
                        user: { select: { id: true, username: true, avatarUrl: true, role: true } },
                        likes: { select: { userId: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: { reviews: true, watchedBy: true, watchlistBy: true },
                },
            },
        });


        // Check if current user has interacted, using localMovie id if exists, otherwise they haven't interacted since it's not saved.
        const session = await auth();
        let userInteraction = null;

        if (session?.user && localMovie) {
            const [watched, watchlisted, rating, review, customPoster] = await Promise.all([
                prisma.watchedMovie.findUnique({
                    where: { userId_movieId: { userId: session.user.id, movieId: localMovie.id } },
                    select: { rewatchCount: true, lastRewatchedAt: true },
                }),
                prisma.watchlistItem.findUnique({
                    where: { userId_movieId: { userId: session.user.id, movieId: localMovie.id } },
                }),
                prisma.rating.findUnique({
                    where: { userId_movieId: { userId: session.user.id, movieId: localMovie.id } },
                }),
                prisma.review.findUnique({
                    where: { userId_movieId: { userId: session.user.id, movieId: localMovie.id } },
                    select: { id: true },
                }),
                prisma.customPoster.findUnique({
                    where: { userId_movieId: { userId: session.user.id, movieId: localMovie.id } },
                    select: { posterUrl: true },
                }),
            ]);

            userInteraction = {
                watched: !!watched,
                watchlisted: !!watchlisted,
                rating: rating?.value ?? null,
                hasReview: !!review,
                customPosterUrl: customPoster?.posterUrl || null,
                rewatchCount: watched?.rewatchCount ?? 0,
                lastRewatchedAt: watched?.lastRewatchedAt?.toISOString() ?? null,
            };
        }

        return successResponse({
            id: tmdbMovie.id.toString(), // Using tmdbId as the primary string id for frontend
            localId: localMovie?.id || null, // Pass local UUID if we need it for interactions
            title: tmdbMovie.title,
            year: tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.substring(0, 4)) : 0,
            posterUrl: getTMDBImageUrl(tmdbMovie.poster_path, 'original'),
            backdropUrl: getTMDBImageUrl(tmdbMovie.backdrop_path, 'original'),
            description: tmdbMovie.overview,
            genres: tmdbMovie.genres || [],
            runtime: tmdbMovie.runtime ?? null,
            language: tmdbMovie.original_language ?? null,
            country: tmdbMovie.production_countries?.[0]?.name ?? null,
            director: director
                ? {
                      id: director.id,
                      name: director.name,
                      profileUrl: getTMDBImageUrl(director.profile_path, 'w185'),
                  }
                : null,
            cast,
            trailerKey: trailer?.key ?? null,
            similarMovies,
            averageRating: tmdbMovie.vote_average ? parseFloat((tmdbMovie.vote_average / 2).toFixed(1)) : null, // keep the TMDB one to display on the movie page
            ratingCount: localMovie ? localMovie.ratings.length : 0,       // We can use local counts for these stats or ignore them
            reviewCount: localMovie ? localMovie._count.reviews : 0,
            watchedCount: localMovie ? localMovie._count.watchedBy : 0,
            watchlistCount: localMovie ? localMovie._count.watchlistBy : 0,
            reviews: localMovie ? localMovie.reviews.map(r => ({
                id: r.id,
                content: r.content,
                containsSpoilers: r.containsSpoilers,
                createdAt: r.createdAt,
                user: r.user,
                likeCount: r.likes.length,
                likedByMe: session?.user?.id ? r.likes.some(l => l.userId === session.user.id) : false,
            })) : [],
            userInteraction,
        });
    } catch (error) {
        console.error('GET /api/movies/[id] error:', error);
        return serverError();
    }
}
