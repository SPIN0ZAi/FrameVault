import { getTMDBGenres } from '@/lib/tmdb';
import { successResponse, serverError } from '@/lib/api-response';

export async function GET() {
    try {
        const tmdbGenres = await getTMDBGenres();
        const genres = tmdbGenres.map(g => ({
            id: g.id.toString(),
            name: g.name,
            slug: g.id.toString(), // pass TMDB genre ID as slug so discover works
        }));
        return successResponse(genres);
    } catch (error) {
        console.error('GET /api/genres error:', error);
        return serverError();
    }
}
