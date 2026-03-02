const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
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

    console.log("TMDB_API_KEY is:", process.env.TMDB_API_KEY ? "Present" : "Missing", process.env.TMDB_API_KEY ? `(Length: ${process.env.TMDB_API_KEY.length})` : "");

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
    return fetchFromTMDB<TMDBResponse<TMDBMovie>>('/movie/popular', { page: page.toString() });
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
        'vote_count.gte': '50', // filter out obscure entries
    };
    if (options.genre) params.with_genres = options.genre;
    return fetchFromTMDB<TMDBResponse<TMDBMovie>>('/discover/movie', params);
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
    return fetchFromTMDB<TMDBResponse<TMDBMovie>>(`/movie/${id}/similar`);
}

export async function getTrendingMovies(): Promise<TMDBResponse<TMDBMovie>> {
    return fetchFromTMDB<TMDBResponse<TMDBMovie>>('/trending/movie/week');
}

export async function getTopRatedMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
    return fetchFromTMDB<TMDBResponse<TMDBMovie>>('/movie/top_rated', { page: page.toString() });
}

export function getTMDBImageUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w500') {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
}
