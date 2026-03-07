// GET /api/movies — list + search + filter
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createMovieSchema } from '@/lib/validators';
import { successResponse, validationError, unauthorizedError, forbiddenError, serverError } from '@/lib/api-response';
import { searchMoviesEnhanced, discoverMovies, getTMDBImageUrl } from '@/lib/tmdb';
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const search = searchParams.get('search') || '';
        const genre = searchParams.get('genre') || '';
        const sort = searchParams.get('sort') || 'popular';

        let tmdbData;
        if (search) {
            tmdbData = await searchMoviesEnhanced(search, page);
        } else {
            tmdbData = await discoverMovies({ page, genre, sort });
        }

        // Format TMDB results to match our expected frontend structure
        const formattedMovies = tmdbData.results.map((tmdbMovie) => ({
            id: tmdbMovie.id.toString(),
            title: tmdbMovie.title,
            year: tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.substring(0, 4)) : 0,
            posterUrl: getTMDBImageUrl(tmdbMovie.poster_path),
            description: tmdbMovie.overview,
            genres: tmdbMovie.genre_ids ? tmdbMovie.genre_ids.map(id => ({ id: id.toString(), name: 'Genre', slug: 'genre' })) : [],
            averageRating: tmdbMovie.vote_average ? parseFloat(tmdbMovie.vote_average.toFixed(1)) : null,
            ratingCount: 0,
            reviewCount: 0,
            watchedCount: 0,
        }));

        return successResponse(formattedMovies, {
            page: tmdbData.page,
            limit: 20, // TMDB defaults to 20
            totalCount: tmdbData.total_results,
            totalPages: tmdbData.total_pages,
        });
    } catch (error) {
        console.error('GET /api/movies error:', error);
        return serverError();
    }
}

// POST /api/movies — create a movie (owner-only)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return unauthorizedError();
        }
        // Only the site owner may create movies directly
        const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
        if (dbUser?.role !== 'owner') {
            return forbiddenError('Only the site owner can create movies');
        }

        const body = await request.json();
        const result = createMovieSchema.safeParse(body);

        if (!result.success) {
            return validationError(
                result.error.issues[0].message,
                result.error.issues.map((e) => ({ field: e.path.map(String).join('.'), issue: e.message }))
            );
        }

        const { title, year, description, genreIds, posterUrl } = result.data;

        const movie = await prisma.movie.create({
            data: {
                title,
                year,
                description,
                posterUrl,
                genres: genreIds
                    ? { create: genreIds.map((gId) => ({ genreId: gId })) }
                    : undefined,
            },
            include: {
                genres: { include: { genre: true } },
            },
        });

        return successResponse(movie);
    } catch (error) {
        console.error('POST /api/movies error:', error);
        return serverError();
    }
}
