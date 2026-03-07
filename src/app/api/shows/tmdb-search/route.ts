import { NextRequest } from 'next/server';
import { searchShows, getTMDBImageUrl } from '@/lib/tmdb';
import { successResponse, serverError } from '@/lib/api-response';

// GET /api/shows/tmdb-search?q=query — TMDB TV show search for favorites/lists
export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) return successResponse([]);

    try {
        const data = await searchShows(q, 1);
        const results = (data.results ?? []).slice(0, 12).map(s => ({
            tmdbShowId: s.id,
            title: s.name,
            year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : null,
            posterUrl: getTMDBImageUrl(s.poster_path, 'w185'),
        }));
        return successResponse(results);
    } catch (error) {
        console.error('TMDB show search error:', error);
        return serverError();
    }
}
