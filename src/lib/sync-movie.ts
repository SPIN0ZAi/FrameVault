import { prisma } from '@/lib/prisma';
import { getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';

/**
 * Ensures a TMDB movie exists in the local database.
 * If it doesn't, it fetches the details from TMDB and creates it.
 *
 * @param tmdbId The TMDB ID (string or number)
 * @returns The local database UUID for the movie.
 */
export async function syncTMDBMovie(tmdbId: string | number): Promise<string> {
    const numericId = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId;

    if (!Number.isInteger(numericId) || numericId <= 0 || numericId > 1_000_000_000) {
        throw new Error(`Invalid TMDB ID: ${tmdbId}`);
    }

    // Check if the movie already exists locally
    let localMovie = await prisma.movie.findUnique({
        where: { tmdbId: numericId },
        select: { id: true },
    });

    if (localMovie) {
        return localMovie.id; // Return the existing UUID
    }

    // It doesn't exist, we must fetch from TMDB and save it
    const tmdbMovie = await getMovieDetails(numericId);

    // Create the movie.
    // TMDB has genres, but bridging them to the local `Genre` table is complex here.
    // For now, we will create the movie without establishing genre relations.
    // We could optimize this later if genres are critical for local filtering.
    localMovie = await prisma.movie.create({
        data: {
            title: tmdbMovie.title,
            year: tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.substring(0, 4)) : 0,
            description: tmdbMovie.overview,
            posterUrl: getTMDBImageUrl(tmdbMovie.poster_path, 'original'),
            tmdbId: numericId,
        },
        select: { id: true }
    });

    return localMovie.id;
}
