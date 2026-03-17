import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, serverError } from '@/lib/api-response';
import { getTMDBImageUrl, searchMovies, searchPeople, searchShows } from '@/lib/tmdb';

type SuggestionType = 'movie' | 'show' | 'actor' | 'list';

interface SuggestionItem {
    id: string;
    type: SuggestionType;
    label: string;
    sublabel?: string;
    href: string;
    imageUrl?: string | null;
    score: number;
}

function normalize(text: string) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function bigrams(value: string): string[] {
    if (value.length < 2) return [value];
    const grams: string[] = [];
    for (let i = 0; i < value.length - 1; i += 1) grams.push(value.slice(i, i + 2));
    return grams;
}

function diceCoefficient(a: string, b: string) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const aGrams = bigrams(a);
    const bGrams = bigrams(b);
    const bCount = new Map<string, number>();
    for (const gram of bGrams) bCount.set(gram, (bCount.get(gram) ?? 0) + 1);
    let overlap = 0;
    for (const gram of aGrams) {
        const count = bCount.get(gram) ?? 0;
        if (count > 0) {
            overlap += 1;
            bCount.set(gram, count - 1);
        }
    }
    return (2 * overlap) / (aGrams.length + bGrams.length);
}

function scoreMatch(query: string, target: string) {
    const q = normalize(query);
    const t = normalize(target);
    if (!q || !t) return 0;
    if (t === q) return 1;

    let score = 0;
    if (t.startsWith(q)) score += 0.75;
    if (t.includes(q)) score += 0.45;
    score += diceCoefficient(q, t) * 0.45;

    const qWords = q.split(' ');
    const tWords = t.split(' ');
    const wordMatches = qWords.filter((w) => tWords.some((tw) => tw.startsWith(w) || tw.includes(w))).length;
    score += (wordMatches / Math.max(qWords.length, 1)) * 0.25;

    return Math.min(1, score);
}

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) {
        return successResponse({
            query: q,
            items: [] as SuggestionItem[],
        });
    }

    try {
        const [movieData, showData, peopleData, lists] = await Promise.all([
            searchMovies(q, 1),
            searchShows(q, 1),
            searchPeople(q, 1),
            prisma.list.findMany({
                where: {
                    isPublic: true,
                },
                select: {
                    id: true,
                    title: true,
                    user: {
                        select: {
                            username: true,
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                            movies: true,
                        },
                    },
                },
                orderBy: [{ isOfficial: 'desc' }, { isFeatured: 'desc' }, { updatedAt: 'desc' }],
                take: 120,
            }),
        ]);

        const movieItems: SuggestionItem[] = (movieData.results ?? []).slice(0, 6).map((m) => {
            const year = m.release_date ? m.release_date.slice(0, 4) : '—';
            return {
                id: `movie-${m.id}`,
                type: 'movie',
                label: m.title,
                sublabel: `Movie · ${year}`,
                href: `/movies/${m.id}`,
                imageUrl: getTMDBImageUrl(m.poster_path, 'w185'),
                score: scoreMatch(q, m.title),
            };
        });

        const showItems: SuggestionItem[] = (showData.results ?? []).slice(0, 6).map((s) => {
            const year = s.first_air_date ? s.first_air_date.slice(0, 4) : '—';
            return {
                id: `show-${s.id}`,
                type: 'show',
                label: s.name,
                sublabel: `Show · ${year}`,
                href: `/shows/${s.id}`,
                imageUrl: getTMDBImageUrl(s.poster_path, 'w185'),
                score: scoreMatch(q, s.name),
            };
        });

        const actorItems: SuggestionItem[] = (peopleData.results ?? [])
            .filter((p) => (p.known_for_department || '').toLowerCase() === 'acting')
            .slice(0, 6)
            .map((p) => ({
                id: `actor-${p.id}`,
                type: 'actor',
                label: p.name,
                sublabel: 'Actor',
                href: `/actors/${p.id}`,
                imageUrl: getTMDBImageUrl(p.profile_path, 'w185'),
                score: scoreMatch(q, p.name),
            }));

        const listItems: SuggestionItem[] = lists
            .map((list) => ({
                id: `list-${list.id}`,
                type: 'list' as const,
                label: list.title,
                sublabel: `List · by ${list.user.username} · ${list._count.movies} items · ${list._count.likes} likes`,
                href: `/lists/${list.id}`,
                score: scoreMatch(q, list.title) + Math.min(0.2, list._count.likes / 500),
            }))
            .filter((item) => item.score >= 0.28)
            .slice(0, 8);

        const items = [...movieItems, ...showItems, ...actorItems, ...listItems]
            .sort((a, b) => b.score - a.score)
            .slice(0, 12)
            .map(({ score, ...item }) => item);

        return successResponse({
            query: q,
            items,
        });
    } catch (error) {
        console.error('GET /api/search/autocomplete error:', error);
        return serverError();
    }
}
