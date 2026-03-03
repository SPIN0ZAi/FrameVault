'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Search, SlidersHorizontal, X } from 'lucide-react';

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

const SORT_OPTIONS = [
    { key: 'popular', label: '🔥 Popular' },
    { key: 'top_rated', label: '⭐ Top Rated' },
    { key: 'newest', label: '🆕 Newest' },
    { key: 'oldest', label: '🕰️ Oldest' },
    { key: 'title_asc', label: 'A–Z' },
] as const;

const DECADES = [
    { label: '2020s', value: '2020' },
    { label: '2010s', value: '2010' },
    { label: '2000s', value: '2000' },
    { label: '1990s', value: '1990' },
    { label: '1980s', value: '1980' },
    { label: '1970s', value: '1970' },
    { label: 'Earlier', value: 'earlier' },
] as const;

function Chip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
    return (
        <button onClick={onClick}
            style={{
                padding: '5px 13px',
                borderRadius: 999,
                fontSize: 'var(--text-xs)',
                fontWeight: active ? 700 : 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: active ? (color || 'var(--brand)') : 'var(--bg-secondary)',
                color: active ? (color ? '#fff' : '#000') : 'var(--text-secondary)',
                border: active ? `1.5px solid ${color || 'var(--brand)'}` : '1.5px solid var(--border-default)',
                boxShadow: active ? `0 0 10px ${color || 'var(--brand)'}44` : 'none',
            }}>
            {label}
        </button>
    );
}

const GENRE_COLORS: Record<string, string> = {
    action: '#ef4444', adventure: '#f97316', animation: '#a855f7',
    comedy: '#eab308', crime: '#6366f1', documentary: '#14b8a6',
    drama: '#3b82f6', family: '#ec4899', fantasy: '#8b5cf6',
    history: '#d97706', horror: '#dc2626', music: '#06b6d4',
    mystery: '#7c3aed', romance: '#f43f5e', 'science-fiction': '#00D1C1',
    thriller: '#b45309', war: '#64748b', western: '#92400e',
};

function MoviesInner() {
    const urlParams = useSearchParams();
    const router = useRouter();

    // Initialize all state from URL params so back-navigation restores position
    const [movies, setMovies] = useState<Movie[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(urlParams.get('search') || '');
    const [search, setSearch] = useState(urlParams.get('search') || '');
    const [selectedGenre, setSelectedGenre] = useState(urlParams.get('genre') || '');
    const [sort, setSort] = useState(urlParams.get('sort') || 'popular');
    const [decade, setDecade] = useState(urlParams.get('decade') || '');
    const [page, setPage] = useState(parseInt(urlParams.get('page') || '1'));
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    // Keep URL in sync with state so back/forward works
    useEffect(() => {
        const p = new URLSearchParams();
        if (page > 1) p.set('page', page.toString());
        if (search) p.set('search', search);
        if (selectedGenre) p.set('genre', selectedGenre);
        if (sort !== 'popular') p.set('sort', sort);
        if (decade) p.set('decade', decade);
        const qs = p.toString();
        router.replace(`/movies${qs ? `?${qs}` : ''}`, { scroll: false });
    }, [page, search, selectedGenre, sort, decade]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchMovies = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '24', sort });
            if (search) params.set('search', search);
            if (selectedGenre) params.set('genre', selectedGenre);
            if (decade) params.set('decade', decade);
            const res = await fetch(`/api/movies?${params}`);
            const data = await res.json();
            if (data.success) {
                setMovies(data.data);
                setTotalPages(data.meta?.totalPages || 1);
                setTotal(data.meta?.totalCount || 0);
            }
        } catch { }
        finally { setLoading(false); }
    }, [page, search, selectedGenre, sort, decade]);

    useEffect(() => { fetchMovies(); }, [fetchMovies]);
    useEffect(() => {
        fetch('/api/genres').then(r => r.json()).then(d => { if (d.success) setGenres(d.data); }).catch(() => { });
    }, []);
    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 380);
        return () => clearTimeout(t);
    }, [searchInput]);

    const hasFilters = !!(selectedGenre || decade || sort !== 'popular');
    const clearAll = () => { setSelectedGenre(''); setDecade(''); setSort('popular'); setSearchInput(''); setPage(1); };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Browse Films</h1>
                    <p className="page-subtitle">Discover, rate, and track your favorite movies</p>
                </div>

                {/* Search + filter toggle */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                        <input className="input" placeholder="Search by title…" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                            style={{ paddingLeft: 40 }} id="movie-search" />
                        {searchInput && (
                            <button onClick={() => setSearchInput('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', background: 'none', cursor: 'pointer' }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button onClick={() => setShowFilters(f => !f)}
                        className={`btn btn-sm ${showFilters || hasFilters ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flexShrink: 0, gap: 6 }}>
                        <SlidersHorizontal size={14} /> Filters
                        {hasFilters && (
                            <span style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 999, padding: '0 5px', fontSize: 10 }}>
                                {[selectedGenre, decade, sort !== 'popular' ? '1' : ''].filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <div>
                            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>Sort by</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {SORT_OPTIONS.map(s => <Chip key={s.key} label={s.label} active={sort === s.key} onClick={() => { setSort(s.key); setPage(1); }} />)}
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>Decade</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                <Chip label="All Time" active={!decade} onClick={() => { setDecade(''); setPage(1); }} />
                                {DECADES.map(d => <Chip key={d.value} label={d.label} active={decade === d.value} onClick={() => { setDecade(d.value === decade ? '' : d.value); setPage(1); }} />)}
                            </div>
                        </div>
                        {genres.length > 0 && (
                            <div>
                                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>Genre</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <Chip label="All Genres" active={!selectedGenre} onClick={() => { setSelectedGenre(''); setPage(1); }} />
                                    {genres.map(g => <Chip key={g.id} label={g.name} active={selectedGenre === g.slug} onClick={() => { setSelectedGenre(selectedGenre === g.slug ? '' : g.slug); setPage(1); }} color={GENRE_COLORS[g.slug]} />)}
                                </div>
                            </div>
                        )}
                        {hasFilters && <button onClick={clearAll} style={{ alignSelf: 'flex-start', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><X size={12} /> Clear all filters</button>}
                    </div>
                )}

                {/* Active filter pills */}
                {!showFilters && hasFilters && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
                        {sort !== 'popular' && <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'var(--brand)', color: '#000', fontSize: 'var(--text-xs)', fontWeight: 700 }}>{SORT_OPTIONS.find(s => s.key === sort)?.label}<button onClick={() => setSort('popular')} style={{ background: 'none', cursor: 'pointer' }}><X size={10} /></button></span>}
                        {selectedGenre && <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: GENRE_COLORS[selectedGenre] || 'var(--brand)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 700 }}>{genres.find(g => g.slug === selectedGenre)?.name}<button onClick={() => setSelectedGenre('')} style={{ background: 'none', cursor: 'pointer', color: '#fff' }}><X size={10} /></button></span>}
                        {decade && <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>{DECADES.find(d => d.value === decade)?.label}<button onClick={() => setDecade('')} style={{ background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={10} /></button></span>}
                        <button onClick={clearAll} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', background: 'none', cursor: 'pointer' }}>Clear all</button>
                    </div>
                )}

                {/* Results count */}
                {!loading && total > 0 && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }}>
                        {total.toLocaleString()} film{total !== 1 ? 's' : ''}{search ? ` matching "${search}"` : ''}
                    </p>
                )}

                {/* Movie Grid */}
                {loading ? (
                    <div className="grid grid-movies">
                        {Array.from({ length: 24 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />)}
                    </div>
                ) : movies.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
                        <Film size={48} style={{ margin: '0 auto var(--space-md)', opacity: 0.5 }} />
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>No movies found</h3>
                        <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-md)' }}>{search ? `No results for "${search}"` : 'Try adjusting your filters'}</p>
                        {hasFilters && <button onClick={clearAll} className="btn btn-ghost btn-sm">Clear filters</button>}
                    </div>
                ) : (
                    <div className="grid grid-movies">
                        {movies.map(movie => (
                            <Link href={`/movies/${movie.id}`} key={movie.id} className="movie-card">
                                {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} loading="lazy" /> : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center' }}>
                                        <Film size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{movie.title}</span>
                                    </div>
                                )}
                                {movie.averageRating && <div className="movie-card-rating">★ {movie.averageRating}</div>}
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
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-2xl)', alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                                return <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', fontWeight: p === page ? 800 : 400, fontSize: 'var(--text-xs)', background: p === page ? 'var(--brand)' : 'var(--bg-secondary)', color: p === page ? '#000' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>{p}</button>;
                            })}
                        </div>
                        <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MoviesPage() {
    return (
        <Suspense fallback={<div className="page"><div className="container"><p style={{ color: 'var(--text-secondary)' }}>Loading…</p></div></div>}>
            <MoviesInner />
        </Suspense>
    );
}
