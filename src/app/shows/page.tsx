'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Tv, Search, SlidersHorizontal, X, Eye, BookmarkPlus, Check } from 'lucide-react';
import ShowHoverCard from '@/components/ui/ShowHoverCard';


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
                        {shows.map(show => (
                            <div key={show.id} style={{ position: 'relative' }}>
                                <ShowHoverCard 
                                    id={show.id} 
                                    href={`/shows/${show.id}`} 
                                    title={show.title} 
                                    year={show.year} 
                                    posterUrl={show.posterUrl} 
                                    averageRating={show.averageRating}
                                />
                            </div>
                        ))}

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
