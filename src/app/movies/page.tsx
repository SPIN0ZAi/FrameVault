'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Film } from 'lucide-react';

interface Movie {
    id: string;
    title: string;
    year: number;
    posterUrl: string | null;
    averageRating: number | null;
    genres: { id: string; name: string; slug: string }[];
}

interface Genre {
    id: string;
    name: string;
    slug: string;
}

export default function MoviesPage() {
    const urlParams = useSearchParams();
    const initialSearch = urlParams.get('search') || '';

    const [movies, setMovies] = useState<Movie[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialSearch);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [sort, setSort] = useState('popular');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchMovies = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                sort,
            });
            if (search) params.set('search', search);
            if (selectedGenre) params.set('genre', selectedGenre);

            const res = await fetch(`/api/movies?${params}`);
            const data = await res.json();

            if (data.success) {
                setMovies(data.data);
                setTotalPages(data.meta?.totalPages || 1);
            }
        } catch (err) {
            console.error('Failed to fetch movies:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search, selectedGenre, sort]);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);

    useEffect(() => {
        fetch('/api/genres')
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setGenres(data.data);
            })
            .catch(() => { });
    }, []);

    // Debounced search
    const [searchInput, setSearchInput] = useState(initialSearch);
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Browse Movies</h1>
                    <p className="page-subtitle">Discover, rate, and track your favorite films</p>
                </div>

                {/* Filters */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-md)',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--space-xl)',
                    alignItems: 'center',
                }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Search by title..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            id="movie-search"
                        />
                    </div>
                    <select
                        className="input"
                        style={{ flex: '0 0 auto', width: 'auto', minWidth: '160px' }}
                        value={selectedGenre}
                        onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
                        id="genre-filter"
                    >
                        <option value="">All Genres</option>
                        {genres.map((g) => (
                            <option key={g.id} value={g.slug}>{g.name}</option>
                        ))}
                    </select>
                    <select
                        className="input"
                        style={{ flex: '0 0 auto', width: 'auto', minWidth: '140px' }}
                        value={sort}
                        onChange={(e) => { setSort(e.target.value); setPage(1); }}
                        id="sort-filter"
                    >
                        <option value="popular">Most Popular</option>
                        <option value="top_rated">Top Rated</option>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="title_asc">Title A–Z</option>
                        <option value="title_desc">Title Z–A</option>
                    </select>
                </div>

                {/* Movie Grid */}
                {loading ? (
                    <div className="grid grid-movies">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ aspectRatio: '2/3' }} />
                        ))}
                    </div>
                ) : movies.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
                        <Film size={48} style={{ margin: '0 auto var(--space-md)', opacity: 0.5 }} />
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                            No movies found
                        </h3>
                        <p style={{ fontSize: 'var(--text-sm)' }}>
                            {search ? 'Try a different search term' : 'Movies will appear here once added'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-movies">
                        {movies.map((movie) => (
                            <Link href={`/movies/${movie.id}`} key={movie.id} className="movie-card">
                                {movie.posterUrl ? (
                                    <img src={movie.posterUrl} alt={movie.title} loading="lazy" />
                                ) : (
                                    <div style={{
                                        width: '100%', height: '100%',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        background: 'var(--bg-secondary)',
                                        padding: 'var(--space-md)', textAlign: 'center',
                                        color: 'var(--text-tertiary)',
                                    }}>
                                        <Film size={48} style={{ marginBottom: 'var(--space-sm)', opacity: 0.5 }} />
                                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{movie.title}</span>
                                    </div>
                                )}
                                {movie.averageRating && (
                                    <div className="movie-card-rating">★ {movie.averageRating}</div>
                                )}
                                <div className="movie-card-overlay">
                                    <div className="movie-card-title">{movie.title}</div>
                                    <div className="movie-card-year">{movie.year}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)',
                        marginTop: 'var(--space-2xl)',
                    }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            ← Previous
                        </button>
                        <span style={{
                            display: 'flex', alignItems: 'center',
                            padding: '0 var(--space-md)',
                            fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                        }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
