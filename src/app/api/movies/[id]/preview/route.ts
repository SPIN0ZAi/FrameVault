import { NextRequest } from 'next/server';
import { getMovieCredits, getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';
import { successResponse, serverError } from '@/lib/api-response';

// GET /api/movies/[id]/preview — lightweight hover-preview data
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [credits, movie] = await Promise.all([
            getMovieCredits(id).catch(() => ({ cast: [], crew: [] })),
            getMovieDetails(id).catch(() => null),
        ]);

        const cast = credits.cast.slice(0, 3).map((c) => ({
            name: c.name,
            character: c.character,
        }));

        const backdropUrl = movie?.backdrop_path
            ? getTMDBImageUrl(movie.backdrop_path, 'w500')
            : null;

        const description = movie?.overview ?? null;

        return successResponse({ cast, backdropUrl, description });
    } catch (error) {
        console.error('GET /api/movies/[id]/preview error:', error);
        return serverError();
    }
}
