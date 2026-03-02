import { successResponse, serverError } from '@/lib/api-response';
import { getTopRatedMovies, getTMDBImageUrl } from '@/lib/tmdb';

// GET /api/lists/top250 — fetch TMDB top-rated movies (250 total)
export async function GET() {
    try {
        // 250 movies = 13 pages of 20
        const pages = Array.from({ length: 13 }, (_, i) => i + 1);
        const results = await Promise.all(pages.map((p) => getTopRatedMovies(p)));

        const seen = new Set<number>();
        const movies = results
            .flatMap((r) => r.results)
            .filter((m) => { if (seen.has(m.id)) return false; seen.add(m.id); return true; })
            .slice(0, 250)
            .map((m, i) => ({
                rank: i + 1,
                id: m.id,
                title: m.title,
                year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : 0,
                posterUrl: getTMDBImageUrl(m.poster_path, 'w342'),
                rating: m.vote_average ? parseFloat((m.vote_average / 2).toFixed(1)) : null,
            }));

        return successResponse(movies);
    } catch (error) {
        console.error('GET /api/lists/top250 error:', error);
        return serverError();
    }
}
