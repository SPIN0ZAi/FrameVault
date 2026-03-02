import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchMovies } from '@/lib/tmdb';
import { syncTMDBMovie } from '@/lib/sync-movie';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';

/**
 * POST /api/import/letterboxd
 * Imports a single movie entry from a Letterboxd CSV export.
 *
 * Body: {
 *   title: string
 *   year: number
 *   watched?: boolean
 *   watchedDate?: string   // ISO date string
 *   rating?: number        // 1–10 (already converted from Letterboxd's 0.5–5 scale)
 *   review?: string
 *   watchlist?: boolean
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { title, year, watched, watchedDate, rating, review, watchlist } =
            await request.json();

        if (!title) return serverError('title is required');

        // 1. Search TMDB by title; pick closest year match
        const results = await searchMovies(title, 1);
        const match =
            results.results.find((m) => {
                const movieYear = m.release_date
                    ? parseInt(m.release_date.substring(0, 4))
                    : 0;
                return Math.abs(movieYear - year) <= 1;
            }) ?? results.results[0];

        if (!match) {
            return successResponse({ status: 'not_found', title });
        }

        const tmdbId = match.id.toString();
        const localMovieId = await syncTMDBMovie(tmdbId);
        const actions: string[] = [];

        // 2. Watched
        if (watched) {
            await prisma.watchedMovie.upsert({
                where: { userId_movieId: { userId: session.user.id, movieId: localMovieId } },
                create: {
                    userId: session.user.id,
                    movieId: localMovieId,
                    watchedAt: watchedDate ? new Date(watchedDate) : new Date(),
                },
                update: {},
            });
            actions.push('watched');
        }

        // 3. Watchlist
        if (watchlist) {
            await prisma.watchlistItem.upsert({
                where: { userId_movieId: { userId: session.user.id, movieId: localMovieId } },
                create: { userId: session.user.id, movieId: localMovieId },
                update: {},
            });
            actions.push('watchlist');
        }

        // 4. Rating (1–10)
        if (rating && rating >= 1 && rating <= 10) {
            await prisma.rating.upsert({
                where: { userId_movieId: { userId: session.user.id, movieId: localMovieId } },
                create: { userId: session.user.id, movieId: localMovieId, value: rating },
                update: { value: rating },
            });
            actions.push(`rated ${rating}/10`);
        }

        // 5. Review
        if (review && review.trim().length >= 5) {
            const existing = await prisma.review.findUnique({
                where: { userId_movieId: { userId: session.user.id, movieId: localMovieId } },
            });
            if (!existing) {
                await prisma.review.create({
                    data: {
                        userId: session.user.id,
                        movieId: localMovieId,
                        content: review.trim(),
                        containsSpoilers: false,
                    },
                });
                actions.push('review');
            }
        }

        return successResponse({ status: 'imported', title, tmdbId, actions });
    } catch (error) {
        console.error('Letterboxd import error:', error);
        return serverError();
    }
}
