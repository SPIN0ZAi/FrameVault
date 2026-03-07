import { NextRequest } from 'next/server';
import { fetchFromTMDB, getTMDBImageUrl } from '@/lib/tmdb';
import { successResponse, serverError } from '@/lib/api-response';

interface TMDBImagesResponse {
    posters: { file_path: string; vote_average: number; iso_639_1: string | null }[];
}

// GET /api/shows/[id]/tmdb-posters — alternative poster images from TMDB for a TV show
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await fetchFromTMDB<TMDBImagesResponse>(`/tv/${id}/images`, {
            include_image_language: 'en,null',
        });

        const seen = new Set<string>();
        const posters = data.posters
            .sort((a, b) => b.vote_average - a.vote_average)
            .filter(p => {
                if (seen.has(p.file_path)) return false;
                seen.add(p.file_path);
                return true;
            })
            .slice(0, 24)
            .map(p => ({
                thumb: getTMDBImageUrl(p.file_path, 'w342'),
                full: getTMDBImageUrl(p.file_path, 'original'),
            }));

        return successResponse(posters);
    } catch (error) {
        console.error('GET show tmdb-posters error:', error);
        return serverError();
    }
}
