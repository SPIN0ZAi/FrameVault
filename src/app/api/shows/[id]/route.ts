import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';
import { getShowDetails, fetchFromTMDB, getTMDBImageUrl } from '@/lib/tmdb';

interface TMDBShowFull {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    adult?: boolean;
    genres?: { id: number; name: string }[];
    number_of_seasons?: number;
    number_of_episodes?: number;
    original_language?: string;
    origin_country?: string[];
    networks?: { id: number; name: string; logo_path: string | null }[];
    status?: string;
    tagline?: string;
    created_by?: { id: number; name: string; profile_path: string | null }[];
    last_air_date?: string;
    episode_run_time?: number[];
    in_production?: boolean;
    next_episode_to_air?: { air_date: string; name: string } | null;
    seasons?: { id: number; name: string; season_number: number; episode_count: number; poster_path: string | null }[];
}

interface TMDBCredits {
    cast: { id: number; name: string; character: string; profile_path: string | null; order: number }[];
    crew: { id: number; name: string; job: string; department: string; profile_path: string | null }[];
}

interface TMDBVideos {
    results: { id: string; key: string; site: string; type: string; official: boolean }[];
}

interface TMDBSimilarShows {
    results: {
        id: number; name: string; poster_path: string | null; first_air_date: string;
    }[];
}

// GET /api/shows/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        let tmdbShow: TMDBShowFull;
        try {
            tmdbShow = await getShowDetails(id) as TMDBShowFull;
        } catch {
            return notFoundError('Show not found on TMDB');
        }

        // Fetch credits, videos, similar in parallel
        const [credits, videos, similar] = await Promise.all([
            fetchFromTMDB<TMDBCredits>(`/tv/${id}/credits`).catch(() => ({ cast: [], crew: [] })),
            fetchFromTMDB<TMDBVideos>(`/tv/${id}/videos`).catch(() => ({ results: [] })),
            fetchFromTMDB<TMDBSimilarShows>(`/tv/${id}/similar`).catch(() => ({ results: [] })),
        ]);

        const trailer =
            videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
            videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer') ??
            videos.results.find(v => v.site === 'YouTube' && v.type === 'Teaser') ??
            null;

        const cast = credits.cast.slice(0, 10).map(c => ({
            id: c.id,
            name: c.name,
            character: c.character,
            profileUrl: getTMDBImageUrl(c.profile_path, 'w185'),
        }));

        const similarShows = similar.results.slice(0, 12).map(s => ({
            id: s.id,
            title: s.name,
            year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : 0,
            posterUrl: getTMDBImageUrl(s.poster_path, 'w342'),
        }));

        // Check user interaction
        const session = await auth();
        let userInteraction: { watched: boolean; inWatchlist: boolean } = { watched: false, inWatchlist: false };

        if (session?.user) {
            const tmdbShowId = parseInt(id);
            const [watched, watchlisted] = await Promise.all([
                prisma.watchedShow.findUnique({
                    where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
                }),
                prisma.showWatchlistItem.findUnique({
                    where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
                }),
            ]);
            userInteraction = { watched: !!watched, inWatchlist: !!watchlisted };
        }

        return successResponse({
            id: tmdbShow.id.toString(),
            title: tmdbShow.name,
            year: tmdbShow.first_air_date ? parseInt(tmdbShow.first_air_date.substring(0, 4)) : 0,
            lastAirYear: tmdbShow.last_air_date ? parseInt(tmdbShow.last_air_date.substring(0, 4)) : null,
            posterUrl: getTMDBImageUrl(tmdbShow.poster_path, 'original'),
            backdropUrl: getTMDBImageUrl(tmdbShow.backdrop_path, 'original'),
            description: tmdbShow.overview,
            genres: tmdbShow.genres ?? [],
            numberOfSeasons: tmdbShow.number_of_seasons ?? null,
            numberOfEpisodes: tmdbShow.number_of_episodes ?? null,
            language: tmdbShow.original_language ?? null,
            networks: (tmdbShow.networks ?? []).map(n => ({
                id: n.id,
                name: n.name,
                logoUrl: n.logo_path ? `https://image.tmdb.org/t/p/w92${n.logo_path}` : null,
            })),
            status: tmdbShow.status ?? null,
            tagline: tmdbShow.tagline ?? null,
            createdBy: (tmdbShow.created_by ?? []).map(c => ({
                id: c.id,
                name: c.name,
                profileUrl: getTMDBImageUrl(c.profile_path, 'w185'),
            })),
            episodeRuntime: tmdbShow.episode_run_time?.[0] ?? null,
            voteAverage: tmdbShow.vote_average,
            voteCount: tmdbShow.vote_count,
            nextEpisode: tmdbShow.next_episode_to_air ?? null,
            seasons: (tmdbShow.seasons ?? [])
                .filter(s => s.season_number > 0)
                .map(s => ({
                    id: s.id,
                    name: s.name,
                    seasonNumber: s.season_number,
                    episodeCount: s.episode_count,
                    posterUrl: getTMDBImageUrl(s.poster_path, 'w185'),
                })),
            cast,
            trailerKey: trailer?.key ?? null,
            similarShows,
            userInteraction,
        });
    } catch (error) {
        console.error('GET /api/shows/[id] error:', error);
        return serverError();
    }
}
