// GET /api/shows — browse + search TV shows via TMDB
import { NextRequest } from 'next/server';
import { searchShowsEnhanced, discoverShows, getTMDBImageUrl } from '@/lib/tmdb';
import { successResponse, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page  = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const search = searchParams.get('search') || '';
        const genre  = searchParams.get('genre') || '';
        const sort   = searchParams.get('sort') || 'popular';

        let tmdbData;
        if (search) {
            tmdbData = await searchShowsEnhanced(search, page);
        } else {
            tmdbData = await discoverShows({ page, genre, sort });
        }

        const formattedShows = tmdbData.results.map(show => ({
            id: show.id.toString(),
            title: show.name,
            year: show.first_air_date ? parseInt(show.first_air_date.substring(0, 4)) : 0,
            posterUrl: getTMDBImageUrl(show.poster_path),
            description: show.overview,
            genres: show.genre_ids
                ? show.genre_ids.map(id => ({ id: id.toString(), name: 'Genre', slug: 'genre' }))
                : [],
            averageRating: show.vote_average ? parseFloat(show.vote_average.toFixed(1)) : null,
        }));

        return successResponse(formattedShows, {
            page: tmdbData.page,
            limit: 20,
            totalCount: tmdbData.total_results,
            totalPages: tmdbData.total_pages,
        });
    } catch (error) {
        console.error('GET /api/shows error:', error);
        return serverError();
    }
}
