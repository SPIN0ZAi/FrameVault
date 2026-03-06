const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    adult?: boolean;
    genre_ids?: number[];
    genres?: { id: number; name: string }[];
    runtime?: number;
    original_language?: string;
    production_countries?: { iso_3166_1: string; name: string }[];
}

export interface TMDBCastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface TMDBCrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}

export interface TMDBVideo {
    id: string;
    key: string;
    site: string;
    type: string;
    official: boolean;
}

interface TMDBResponse<T> {
    results: T[];
    page: number;
    total_pages: number;
    total_results: number;
}

export async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const urlParams = new URLSearchParams({
        ...params,
    });

    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${urlParams.toString()}`, {
        headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
            accept: 'application/json',
        },
        next: { revalidate: 3600 }, // Cache TMDB responses for 1 hour by default
    });

    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.statusText}`);
    }

    return response.json();
}

export async function getPopularMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
    const data = await fetchFromTMDB<TMDBResponse<TMDBMovie>>('/movie/popular', {
        page: page.toString(),
        include_adult: 'false',
    });
    data.results = data.results.filter(m => !isAdultContent(m));
    return data;
}

export async function searchMovies(query: string, page = 1): Promise<TMDBResponse<TMDBMovie>> {
    return fetchFromTMDB<TMDBResponse<TMDBMovie>>('/search/movie', {
        query,
        page: page.toString(),
    });
}

export async function getMovieDetails(id: string | number): Promise<TMDBMovie> {
    return fetchFromTMDB<TMDBMovie>(`/movie/${id}`);
}

/**
 * Enhanced movie search with three-tier fallback strategy.
 *
 * Tier 1 — Standard /search/movie + our custom adult-content phrase filter.
 * Tier 2 — If TMDB returned results but our phrase filter removed them all,
 *           relax to TMDB's own `adult` flag only. This handles legitimate
 *           award films (e.g. Holy Spider / عنکبوت مقدس) whose overviews
 *           describe sensitive topics without the film itself being adult content.
 * Tier 3 — If TMDB's movie search returned zero results, fall back to
 *           /search/multi which also matches on original titles, alternate
 *           titles and transliterated queries — useful for non-Latin searches.
 */
export async function searchMoviesEnhanced(
    query: string,
    page = 1,
): Promise<TMDBResponse<TMDBMovie>> {
    const baseParams = { query, page: page.toString(), include_adult: 'false' };

    // ── Tier 1: standard search + full phrase filter ──────────────────────────
    const primary = await fetchFromTMDB<TMDBResponse<TMDBMovie>>('/search/movie', baseParams);
    const tier1 = primary.results.filter(m => !isAdultContent(m));
    if (tier1.length > 0) return { ...primary, results: tier1 };

    // ── Tier 2: our filter was too aggressive — relax to TMDB adult flag only ─
    if (primary.total_results > 0) {
        const tier2 = primary.results.filter(m => !m.adult);
        if (tier2.length > 0) return { ...primary, results: tier2 };
    }

    // ── Tier 3: /search/multi for non-Latin titles & alternate title matches ──
    try {
        type MultiResult = TMDBMovie & { media_type: string };
        const multi = await fetchFromTMDB<{
            results: MultiResult[];
            page: number;
            total_pages: number;
            total_results: number;
        }>('/search/multi', { query, page: page.toString(), include_adult: 'false' });

        const tier3 = multi.results
            .filter((r): r is MultiResult => r.media_type === 'movie' && !r.adult)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(({ media_type: _mt, ...m }) => m as TMDBMovie);

        return {
            results: tier3,
            page: multi.page,
            total_pages: multi.total_pages,
            total_results: tier3.length,
        };
    } catch {
        return { results: [], page: 1, total_pages: 0, total_results: 0 };
    }
}

// ─── Adult / explicit content filter ─────────────────────────────────────────
// TMDB's include_adult flag is unreliable — many explicitly sexual titles are
// not tagged as adult in TMDB's own database.  We apply a two-tier keyword
// check against title + overview as a safety net.
//
// Philosophy: block movies whose PRIMARY theme is sexual/explicit.
// A war film with an R-rated scene is fine; a film whose entire premise is
// sexual should not appear on the site unless the user explicitly searches.

// Short words matched as whole-words only (avoid false positives like
// "Essex" or "Middlesex").
const ADULT_WHOLE_WORDS = new Set([
    'sex', 'porn', 'porno', 'xxx', 'hentai', 'erotic', 'erotica',
    'nude', 'nudist', 'nudity', 'milf', 'gilf', 'incest', 'fetish',
    'bondage', 'bdsm', 'nympho', 'nymphomaniac', 'brothel',
    'prostitute', 'prostitution', 'stripper', 'strippers',
    'camgirl', 'camboy', 'onlyfans', 'sexploitation', 'softcore', 'hardcore',
    'orgy', 'voyeur', 'exhibitionist',
]);

// Phrases matched as substrings (order matters — more specific first).
const ADULT_PHRASES = [
    'japanese mom', 'asian mom', 'stepmom', 'step-mom', 'step mom',
    'stepmother fantasy', 'av idol', 'jav idol', 'jav model',
    'adult film', 'adult video', 'adult movie', 'adult content',
    'adult entertainer', 'adult star', 'sex tape',
    'sex club', 'sex party', 'sex tourism',
    'erotic thriller', 'erotic drama', 'sexual fantasy', 'sexual encounter',
    'sexual content', 'explicit sex', 'graphic sex', 'explicit content',
    'sexually explicit', 'gratuitous nudity',
    // Non-Latin scripts for common offenders
    '일본엄마', '섹시', '온리팬', '낮에는 청순',
];

function isAdultWord(word: string): boolean {
    return ADULT_WHOLE_WORDS.has(word);
}

export function isAdultContent(m: { title: string; overview: string; adult?: boolean }): boolean {
    if (m.adult) return true;
    const text = `${m.title} ${m.overview}`.toLowerCase();

    // Phrase check (substring)
    if (ADULT_PHRASES.some(p => text.includes(p))) return true;

    // Whole-word check using a simple token split on non-alpha characters
    const words = text.split(/[^a-z]+/);
    return words.some(w => isAdultWord(w));
}

const TMDB_SORT_MAP: Record<string, string> = {
    newest: 'primary_release_date.desc',
    oldest: 'primary_release_date.asc',
    title_asc: 'original_title.asc',
    title_desc: 'original_title.desc',
    popular: 'popularity.desc',
    top_rated: 'vote_average.desc',
};

export async function discoverMovies(options: {
    page?: number;
    genre?: string;
    sort?: string;
}): Promise<TMDBResponse<TMDBMovie>> {
    const params: Record<string, string> = {
        page: (options.page || 1).toString(),
        sort_by: TMDB_SORT_MAP[options.sort || 'popular'] || 'popularity.desc',
        'vote_count.gte': '150', // filters out obscure/explicit low-engagement titles
        include_adult: 'false',
    };
    if (options.genre) params.with_genres = options.genre;
    const data = await fetchFromTMDB<TMDBResponse<TMDBMovie>>('/discover/movie', params);
    data.results = data.results.filter(m => !isAdultContent(m));
    return data;
}

export async function getTMDBGenres(): Promise<{ id: number; name: string }[]> {
    const data = await fetchFromTMDB<{ genres: { id: number; name: string }[] }>('/genre/movie/list');
    return data.genres;
}

export async function getMovieCredits(id: string | number): Promise<{ cast: TMDBCastMember[]; crew: TMDBCrewMember[] }> {
    return fetchFromTMDB<{ cast: TMDBCastMember[]; crew: TMDBCrewMember[] }>(`/movie/${id}/credits`);
}

export async function getMovieVideos(id: string | number): Promise<{ results: TMDBVideo[] }> {
    return fetchFromTMDB<{ results: TMDBVideo[] }>(`/movie/${id}/videos`);
}

export async function getSimilarMovies(id: string | number): Promise<TMDBResponse<TMDBMovie>> {
    const data = await fetchFromTMDB<TMDBResponse<TMDBMovie>>(`/movie/${id}/similar`);
    // vote_count.gte not available on /similar endpoint, so filter manually
    data.results = data.results.filter(m => !isAdultContent(m) && (m.vote_average ?? 0) > 0);
    return data;
}

export async function getTrendingMovies(): Promise<TMDBResponse<TMDBMovie>> {
    const data = await fetchFromTMDB<TMDBResponse<TMDBMovie>>('/trending/movie/week', {
        include_adult: 'false',
    });
    data.results = data.results.filter(m => !isAdultContent(m));
    return data;
}

export async function getTopRatedMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
    const data = await fetchFromTMDB<TMDBResponse<TMDBMovie>>('/movie/top_rated', {
        page: page.toString(),
        include_adult: 'false',
    });
    data.results = data.results.filter(m => !isAdultContent(m));
    return data;
}

export function getTMDBImageUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w500') {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
}

export interface TMDBPersonDetails {
    id: number;
    name: string;
    biography: string;
    birthday: string | null;
    deathday: string | null;
    place_of_birth: string | null;
    profile_path: string | null;
    known_for_department: string;
    popularity: number;
}

export interface TMDBMovieCredit {
    id: number;
    title: string;
    character: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    adult?: boolean;
}

export async function getPersonDetails(id: string | number): Promise<TMDBPersonDetails> {
    return fetchFromTMDB<TMDBPersonDetails>(`/person/${id}`);
}

export async function getPersonMovieCredits(id: string | number): Promise<{ cast: TMDBMovieCredit[] }> {
    const data = await fetchFromTMDB<{ cast: TMDBMovieCredit[] }>(`/person/${id}/movie_credits`);
    data.cast = data.cast.filter(m => !isAdultContent({ title: m.title, overview: '', adult: m.adult }));
    return data;
}
