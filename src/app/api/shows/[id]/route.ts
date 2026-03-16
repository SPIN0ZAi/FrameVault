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

interface TMDBShowSearch {
    results: {
        id: number;
        name: string;
        first_air_date: string | null;
    }[];
}

// GET /api/shows/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        let resolvedTmdbId = id;

        let tmdbShow: TMDBShowFull;
        try {
            tmdbShow = await getShowDetails(resolvedTmdbId) as TMDBShowFull;
        } catch {
            const legacyTmdbId = parseInt(id);
            if (!isNaN(legacyTmdbId)) {
                const localShow = await prisma.watchedShow.findFirst({
                    where: { tmdbShowId: legacyTmdbId },
                    select: { title: true, year: true },
                });

                if (localShow?.title) {
                    const search = await fetchFromTMDB<TMDBShowSearch>('/search/tv', {
                        query: localShow.title,
                        include_adult: 'false',
                        language: 'en-US',
                        page: '1',
                    }).catch(() => null);

                    const normalizedLocalTitle = localShow.title.trim().toLowerCase();
                    const bestMatch =
                        search?.results.find((r) => {
                            const titleMatches = r.name.trim().toLowerCase() === normalizedLocalTitle;
                            const yearMatches =
                                !localShow.year ||
                                (r.first_air_date ? parseInt(r.first_air_date.substring(0, 4)) === localShow.year : false);
                            return titleMatches && yearMatches;
                        }) ?? search?.results[0];

                    if (bestMatch) {
                        resolvedTmdbId = bestMatch.id.toString();
                        tmdbShow = await getShowDetails(resolvedTmdbId) as TMDBShowFull;
                    } else {
                        return notFoundError('Show not found on TMDB');
                    }
                } else {
                    return notFoundError('Show not found on TMDB');
                }
            } else {
                return notFoundError('Show not found on TMDB');
            }
        }

        // Fetch credits, videos, recommendations in parallel
        const [credits, videos, similar] = await Promise.all([
            fetchFromTMDB<TMDBCredits>(`/tv/${resolvedTmdbId}/credits`).catch(() => ({ cast: [], crew: [] })),
            fetchFromTMDB<TMDBVideos>(`/tv/${resolvedTmdbId}/videos`).catch(() => ({ results: [] })),
            fetchFromTMDB<TMDBSimilarShows>(`/tv/${resolvedTmdbId}/recommendations`).catch(() => ({ results: [] })),
        ]);

        const trailer =
            videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
            videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer') ??
            videos.results.find(v => v.site === 'YouTube' && v.type === 'Teaser') ??
            null;

        const directorFromCrew =
            credits.crew.find(c => c.job === 'Director') ??
            credits.crew.find(c => c.job === 'Series Director') ??
            credits.crew.find(c => (c.job ?? '').toLowerCase().includes('director')) ??
            null;

        const director = directorFromCrew ?? ((tmdbShow.created_by?.[0] && {
            id: tmdbShow.created_by[0].id,
            name: tmdbShow.created_by[0].name,
            profile_path: tmdbShow.created_by[0].profile_path,
        }) || null);

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
        let userInteraction: {
            watched: boolean;
            inWatchlist: boolean;
            rating: number | null;
            customPosterUrl: string | null;
            hasReview: boolean;
            rewatchCount: number;
            lastRewatchedAt: string | null;
        } = {
            watched: false,
            inWatchlist: false,
            rating: null,
            customPosterUrl: null,
            hasReview: false,
            rewatchCount: 0,
            lastRewatchedAt: null,
        };

        if (session?.user) {
            const tmdbShowId = tmdbShow.id;
            try {
                const fallbackYear = tmdbShow.first_air_date ? parseInt(tmdbShow.first_air_date.substring(0, 4)) : null;
                const watched = await prisma.watchedShow.findFirst({
                    where: {
                        userId: session.user.id,
                        OR: [
                            { tmdbShowId },
                            {
                                title: { equals: tmdbShow.name, mode: 'insensitive' },
                                ...(fallbackYear ? { year: fallbackYear } : {}),
                            },
                        ],
                    },
                    select: {
                        id: true,
                        tmdbShowId: true,
                        watchedAt: true,
                    },
                }).catch(() => null);

                const candidateTmdbIds = Array.from(new Set([
                    tmdbShowId,
                    parseInt(id),
                    parseInt(resolvedTmdbId),
                    watched?.tmdbShowId,
                ].filter((v): v is number => typeof v === 'number' && !isNaN(v))));

                const [watchlisted, ratingRecord, customPoster, userReview] = await Promise.all([
                    prisma.showWatchlistItem.findFirst({
                        where: { userId: session.user.id, tmdbShowId: { in: candidateTmdbIds } },
                    }).catch(() => null),
                    prisma.showRating.findFirst({
                        where: { userId: session.user.id, tmdbShowId: { in: candidateTmdbIds } },
                    }).catch(() => null),
                    prisma.showCustomPoster.findFirst({
                        where: { userId: session.user.id, tmdbShowId: { in: candidateTmdbIds } },
                    }).catch(() => null),
                    prisma.showReview.findFirst({
                        where: { userId: session.user.id, tmdbShowId: { in: candidateTmdbIds } },
                    }).catch(() => null),
                ]);

                const rewatchMeta = await prisma.watchedShow.findFirst({
                    where: { userId: session.user.id, tmdbShowId: { in: candidateTmdbIds } },
                    select: { rewatchCount: true, lastRewatchedAt: true },
                }).catch(() => ({ rewatchCount: 0, lastRewatchedAt: null }));

                userInteraction = {
                    watched: !!watched,
                    inWatchlist: !!watchlisted,
                    rating: ratingRecord?.value ?? null,
                    customPosterUrl: customPoster?.posterUrl ?? null,
                    hasReview: !!userReview,
                    rewatchCount: rewatchMeta?.rewatchCount ?? 0,
                    lastRewatchedAt: rewatchMeta?.lastRewatchedAt?.toISOString() ?? null,
                };
            } catch (error) {
                console.warn('Show user interaction unavailable:', error);
            }
        }

        // Fetch reviews for this show
        const tmdbShowId = tmdbShow.id;
        let formattedReviews: {
            id: string;
            content: string;
            containsSpoilers: boolean;
            createdAt: Date;
            user: { id: string; username: string; avatarUrl: string | null; role: string };
            likeCount: number;
            likedByMe: boolean;
        }[] = [];
        try {
            const reviews = await prisma.showReview.findMany({
                where: { tmdbShowId },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true, role: true } },
                    likes: session?.user ? { where: { userId: session.user.id } } : false,
                    _count: { select: { likes: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });

            formattedReviews = reviews.map(r => ({
                id: r.id,
                content: r.content,
                containsSpoilers: r.containsSpoilers,
                createdAt: r.createdAt,
                user: r.user,
                likeCount: r._count.likes,
                likedByMe: session?.user ? (r.likes as { userId: string }[]).length > 0 : false,
            }));
        } catch (error) {
            console.warn('Show reviews unavailable:', error);
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
            director: director
                ? {
                      id: director.id,
                      name: director.name,
                                            profileUrl: getTMDBImageUrl(director.profile_path, 'w185'),
                  }
                : null,
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
            reviews: formattedReviews,
        });
    } catch (error) {
        console.error('GET /api/shows/[id] error:', error);
        return serverError();
    }
}
