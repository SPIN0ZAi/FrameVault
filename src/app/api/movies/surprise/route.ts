import { NextRequest } from 'next/server';
import { discoverMovies, isAdultContent } from '@/lib/tmdb';
import { syncTMDBMovie } from '@/lib/sync-movie';
import { successResponse, errorResponse } from '@/lib/api-response';

// Map our genre slugs → TMDB genre IDs
const GENRE_SLUG_TO_TMDB: Record<string, string> = {
    action: '28',
    adventure: '12',
    animation: '16',
    comedy: '35',
    crime: '80',
    documentary: '99',
    drama: '18',
    family: '10751',
    fantasy: '14',
    history: '36',
    horror: '27',
    music: '10402',
    mystery: '9648',
    romance: '10749',
    'science-fiction': '878',
    thriller: '53',
    war: '10752',
    western: '37',
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const genreSlug = searchParams.get('genre') || '';
        const tmdbGenreId = genreSlug ? GENRE_SLUG_TO_TMDB[genreSlug] : undefined;

        // Pick a random page from the first 15 pages (quality stays high)
        const randomPage = Math.floor(Math.random() * 15) + 1;

        const data = await discoverMovies({
            page: randomPage,
            sort: 'popular',
            genre: tmdbGenreId,
        });

        const candidates = data.results.filter(
            m => !isAdultContent(m) && m.poster_path && m.overview && m.overview.length > 20
        );

        if (candidates.length === 0) {
            return errorResponse({ code: 'NOT_FOUND', message: 'No movies found for this genre' }, 404);
        }

        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const localId = await syncTMDBMovie(pick.id);

        return successResponse({ id: localId, title: pick.title });
    } catch (err) {
        console.error('[surprise] error:', err);
        return errorResponse({ code: 'INTERNAL_ERROR', message: 'Failed to pick a surprise movie' }, 500);
    }
}
