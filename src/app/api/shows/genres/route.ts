import { getTMDBShowGenres } from '@/lib/tmdb';
import { successResponse, serverError } from '@/lib/api-response';

// GET /api/shows/genres
export async function GET() {
    try {
        const genres = await getTMDBShowGenres();
        return successResponse(genres);
    } catch (error) {
        console.error('GET /api/shows/genres error:', error);
        return serverError();
    }
}
