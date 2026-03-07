'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Tv, Search, SlidersHorizontal, X, Eye, BookmarkPlus, Check } from 'lucide-react';

interface Show {
    id: string;
    title: string;
    year: number;
    posterUrl: string | null;
    averageRating: number | null;
}

interface Genre {
    id: string;
    name: string;
}

const SORT_OPTIONS = [
    { key: 'popular',   label: '🔥 Popular' },
    { key: 'top_rated', label: '⭐ Top Rated' },
    { key: 'newest',    label: '🆕 Newest' },
    { key: 'oldest',    label: '🕰️ Oldest' },
] as const;

const TV_GENRE_COLORS: Record<string, string> = {
    'action & adventure': '#ef4444',
    animation: '#a855f7',
    comedy: '#eab308',
    crime: '#6366f1',
    documentary: '#14b8a6',
    drama: '#3b82f6',
    family: '#ec4899',
    kids: '#f97316',
    mystery: '#7c3aed',
    news: '#64748b',
    reality: '#06b6d4',
    'sci-fi & fantasy': '#00D1C1',
    soap: '#f43f5e',
    talk: '#d97706',
    'war & politics': '#92400e',
    western: '#78350f',
};

function Chip({ label, active, onClick, color }: {
    label: string; active: boolean; onClick: () => void; color?: string;
}) {
    return (
        <button onClick={onClick} style={{
            padding: '5px 13px', borderRadius: 999, fontSize: 'var(--text-xs)',
            fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', cursor: 'pointer',
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

// Per-card action buttons (mark watched / add to watchlist)
function ShowCard({ show }: { show: Show }) {
    const { data: session } = useSession();
    const [watched, setWatched] = useState(false);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [hovered, setHovered] = useState(false);
    const checkedRef = useRef(false);

    useEffect(() => {
        if (!session || checkedRef.current) return;
        checkedRef.current = true;
        Promise.all([
            fetch(`/api/watched-shows/${show.id}`).then(r => r.json()),
            fetch(`/api/show-watchlist/${show.id}`).then(r => r.json()),
        ]).then(([w, wl]) => {
            setWatched(w.data?.watched ?? false);
            setInWatchlist(wl.data?.inWatchlist ?? false);
        }).catch(() => {});
    }, [session, show.id]);

    const toggleWatched = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!session) return;
        const method = watched ? 'DELETE' : 'POST';
        await fetch(`/api/watched-shows/${show.id}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'POST' ? JSON.stringify({ title: show.title, year: show.year, posterUrl: show.posterUrl }) : undefined,
        });
        setWatched(w => !w);
        if (!watched) setInWatchlist(false);
    };

    const toggleWatchlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!session) return;
        const method = inWatchlist ? 'DELETE' : 'POST';
        await fetch(`/api/show-watchlist/${show.id}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'POST' ? JSON.stringify({ title: show.title, year: show.year, posterUrl: show.posterUrl }) : undefined,
        });
        setInWatchlist(wl => !wl);
    };

    return (
        <div style={{ position: 'relative' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Link href={`/shows/${show.id}`} className="movie-card" style={{ display: 'block' }}>
                {show.posterUrl ? (
                    <img src={show.posterUrl} alt={show.title} loading="lazy" />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-md)', textAlign: 'center' }}>
                        <Tv size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{show.title}</span>
                    </div>
                )}
                {show.averageRating && (
                    <div className="movie-card-rating">★ {show.averageRating}</div>
                )}
                <div className="movie-card-overlay">
                    <div className="movie-card-title">{show.title}</div>
                    <div className="movie-card-year">{show.year}</div>
                </div>
            </Link>

            {/* Action buttons — shown on hover or when already marked */}
            {session && (hovered || watched || inWatchlist) && (
                <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10 }}>
                    <button
                        onClick={toggleWatched}
                        title={watched ? 'Unmark watched' : 'Mark as watched'}
                        style={{
                            width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
                            background: watched ? 'var(--brand)' : 'rgba(0,0,0,0.7)',
                            color: watched ? '#000' : '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        }}
                    >
                        {watched ? <Check size={14} strokeWidth={3} /> : <Eye size={14} />}
                    </button>
                    {!watched && (
                        <button
                            onClick={toggleWatchlist}
                            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                            style={{
                                width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                background: inWatchlist ? '#f59e0b' : 'rgba(0,0,0,0.7)',
                                color: inWatchlist ? '#000' : '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            }}
                        >
                            <BookmarkPlus size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function ShowsInner() {
    const urlParams = useSearchParams();
    const router = useRouter();

    const page = parseInt(urlParams.get('page') || '1');
    const search = urlParams.get('search') || '';
    const selectedGenre = urlParams.get('genre') || '';
    const sort = urlParams.get('sort') || 'popular';

    const [shows, setShows] = useState<Show[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(search);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => { setSearchInput(search); }, [search]);

    const go = useCallback((overrides: { page?: number; search?: string; genre?: string; sort?: string }) => {
        const p = new URLSearchParams();
        const pg = overrides.page !== undefined ? overrides.page : page;
        const sr = overrides.search !== undefined ? overrides.search : search;
        const gn = overrides.genre !== undefined ? overrides.genre : selectedGenre;
        const st = overrides.sort !== undefined ? overrides.sort : sort;
        if (pg > 1) p.set('page', pg.toString());
        if (sr) p.set('search', sr);
        if (gn) p.set('genre', gn);
        if (st !== 'popular') p.set('sort', st);
        router.push(`/shows${p.toString() ? `?${p}` : ''}`, { scroll: false });
    }, [page, search, selectedGenre, sort, router]);

    const fetchShows = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), sort });
            if (search) params.set('search', search);
            if (selectedGenre) params.set('genre', selectedGenre);
            const res = await fetch(`/api/shows?${params}`);
            const data = await res.json();
            if (data.success) {
                setShows(data.data);
                setTotalPages(data.meta?.totalPages || 1);
                setTotal(data.meta?.totalCount || 0);
            }
        } catch { } finally { setLoading(false); }
    }, [page, search, selectedGenre, sort]);

    useEffect(() => { fetchShows(); }, [fetchShows]);

    useEffect(() => {
        fetch('/api/shows/genres').then(r => r.json()).then(d => {
            if (d.success) setGenres(d.data);
        }).catch(() => {});
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchInput === search) return;
        const t = setTimeout(() => go({ search: searchInput, page: 1 }), 380);
        return () => clearTimeout(t);
    }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

    const hasFilters = !!(selectedGenre || sort !== 'popular');
    const clearAll = () => { setSearchInput(''); router.push('/shows', { scroll: false }); };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Browse TV Shows</h1>
                    <p className="page-subtitle">Discover, track, and log your favourite series</p>
                </div>

                {/* Search + filter toggle */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                        <input className="input" placeholder="Search TV shows…" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                            style={{ paddingLeft: 40 }} />
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
                    </button>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <div>
                            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>Sort by</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {SORT_OPTIONS.map(s => <Chip key={s.key} label={s.label} active={sort === s.key} onClick={() => go({ sort: s.key, page: 1 })} />)}
                            </div>
                        </div>
                        {genres.length > 0 && (
                            <div>
                                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>Genre</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <Chip label="All Genres" active={!selectedGenre} onClick={() => go({ genre: '', page: 1 })} />
                                    {genres.map(g => {
                                        const slug = g.name.toLowerCase();
                                        return <Chip key={g.id} label={g.name} active={selectedGenre === g.id} onClick={() => go({ genre: selectedGenre === g.id ? '' : g.id, page: 1 })} color={TV_GENRE_COLORS[slug]} />;
                                    })}
                                </div>
                            </div>
                        )}
                        {hasFilters && <button onClick={clearAll} style={{ alignSelf: 'flex-start', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><X size={12} /> Clear all filters</button>}
                    </div>
                )}

                {/* Results count */}
                {!loading && total > 0 && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }}>
                        {total.toLocaleString()} show{total !== 1 ? 's' : ''}{search ? ` matching "${search}"` : ''}
                    </p>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-movies">
                        {Array.from({ length: 24 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />)}
                    </div>
                ) : shows.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
                        <Tv size={48} style={{ margin: '0 auto var(--space-md)', opacity: 0.5 }} />
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>No shows found</h3>
                        <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-md)' }}>{search ? `No results for "${search}"` : 'Try adjusting your filters'}</p>
                        {hasFilters && <button onClick={clearAll} className="btn btn-ghost btn-sm">Clear filters</button>}
                    </div>
                ) : (
                    <div className="grid grid-movies">
                        {shows.map(show => <ShowCard key={show.id} show={show} />)}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-2xl)', alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => go({ page: page - 1 })}>← Previous</button>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                                return <button key={p} onClick={() => go({ page: p })} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', fontWeight: p === page ? 800 : 400, fontSize: 'var(--text-xs)', background: p === page ? 'var(--brand)' : 'var(--bg-secondary)', color: p === page ? '#000' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>{p}</button>;
                            })}
                        </div>
                        <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => go({ page: page + 1 })}>Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ShowsPage() {
    return (
        <Suspense fallback={<div className="page"><div className="container"><p style={{ color: 'var(--text-secondary)' }}>Loading…</p></div></div>}>
            <ShowsInner />
        </Suspense>
    );
}
