import { NextRequest } from 'next/server';
import { searchMovies, getTMDBImageUrl } from '@/lib/tmdb';
import { successResponse, serverError } from '@/lib/api-response';

// GET /api/movies/tmdb-search?q=query  — TMDB movie search for favorites/lists
export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) return successResponse([]);

    try {
        const data = await searchMovies(q, 1);
        const results = (data.results ?? []).slice(0, 12).map(m => ({
            tmdbId: m.id,
            title: m.title,
            year: m.release_date ? parseInt(m.release_date) : null,
            posterUrl: getTMDBImageUrl(m.poster_path, 'w185'),
        }));
        return successResponse(results);
    } catch (error) {
        console.error('TMDB search error:', error);
        return serverError();
    }
}
