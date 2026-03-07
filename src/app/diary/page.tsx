'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Tv, Star, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

interface DiaryEntry {
    id: string;
    watchedAt: string;
    rating: number | null;
    movie: {
        id: string;
        tmdbId: number | null;
        title: string;
        year: number;
        posterUrl: string | null;
        customPosters?: { posterUrl: string }[];
    };
}

interface ShowDiaryEntry {
    id: string;
    tmdbShowId: number;
    title: string;
    year: number | null;
    posterUrl: string | null;
    watchedAt: string;
    rating?: number | null;
}

interface MonthGroup<T> {
    key: string;    // "2026-03"
    label: string;  // "March 2026"
    entries: T[];
}

function StarMini({ value }: { value: number }) {
    const stars = Math.round((value / 10) * 5 * 2) / 2;
    return (
        <div style={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    size={11}
                    fill={stars >= i ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    style={{ color: 'var(--star-filled)', opacity: stars >= i - 0.5 ? 1 : 0.25 }}
                />
            ))}
        </div>
    );
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function groupByMonth<T extends { watchedAt: string }>(entries: T[]): MonthGroup<T>[] {
    const map = new Map<string, T[]>();
    for (const e of entries) {
        const d = new Date(e.watchedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(e);
    }
    const groups: MonthGroup<T>[] = [];
    for (const [key, items] of map) {
        const [year, month] = key.split('-').map(Number);
        groups.push({ key, label: `${MONTH_NAMES[month - 1]} ${year}`, entries: items });
    }
    // newest first
    return groups.sort((a, b) => b.key.localeCompare(a.key));
}

// ─── Row renderers ────────────────────────────────────────────────────────────

function ShowRow({ entry }: { entry: ShowDiaryEntry }) {
    const d = new Date(entry.watchedAt);
    const day = d.getDate();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    return (
        <Link href={`/shows/${entry.tmdbShowId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '52px 48px 1fr auto',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    padding: '10px var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'background 0.1s',
                    cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>{weekday}</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)' }}>{day}</div>
                </div>
                <div style={{ width: 36, height: 54, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
                    {entry.posterUrl
                        ? <img src={entry.posterUrl} alt={entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tv size={14} style={{ opacity: 0.3 }} /></div>
                    }
                </div>
                <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>{entry.year ?? ''}</p>
                </div>
                <div style={{ flexShrink: 0 }}>
                    {entry.rating != null
                        ? <StarMini value={entry.rating} />
                        : <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>no rating</span>
                    }
                </div>
            </div>
        </Link>
    );
}

export default function DiaryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [diaryTab, setDiaryTab] = useState<'movies' | 'shows'>('movies');
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [showEntries, setShowEntries] = useState<ShowDiaryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/login'); return; }
        if (status !== 'authenticated') return;

        Promise.all([
            fetch(`/api/users/${session.user.username}/watched?limit=500&sort=date_desc`).then(r => r.json()),
            fetch(`/api/users/${session.user.username}/shows?limit=500&sort=date_desc`).then(r => r.json()),
        ]).then(([moviesData, showsData]) => {
            if (moviesData.success) setEntries(moviesData.data);
            if (showsData.success) setShowEntries(showsData.data);
        }).finally(() => setLoading(false));
    }, [status, session, router]);

    const movieGroups = groupByMonth(entries);
    const showGroups  = groupByMonth(showEntries);

    // Year list is the union of both tabs so the switcher doesn't jump when switching
    const allYears = [...new Set([
        ...movieGroups.map(g => parseInt(g.key.split('-')[0])),
        ...showGroups.map(g => parseInt(g.key.split('-')[0])),
    ])].sort((a, b) => b - a);

    const activeGroups    = diaryTab === 'movies' ? movieGroups : showGroups;
    const filteredGroups  = activeGroups.filter(g => parseInt(g.key.split('-')[0]) === activeYear);
    const activeCount     = diaryTab === 'movies' ? entries.length : showEntries.length;
    const itemLabel       = diaryTab === 'movies' ? 'film' : 'show';

    if (status === 'loading' || loading) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 760 }}>
                    <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 'var(--space-xl)' }} />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} style={{ marginBottom: 'var(--space-3xl)' }}>
                            <div className="skeleton" style={{ height: 20, width: 140, marginBottom: 'var(--space-lg)' }} />
                            {Array.from({ length: 4 }).map((_, j) => (
                                <div key={j} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)' }} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 760 }}>

                {/* Page header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <BookOpen size={28} style={{ color: 'var(--brand)' }} />
                        <div>
                            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, lineHeight: 1 }}>Diary</h1>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                {activeCount} {itemLabel}{activeCount !== 1 ? 's' : ''} logged
                            </p>
                        </div>
                    </div>

                    {/* Year switcher */}
                    {allYears.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <button
                                onClick={() => {
                                    const idx = allYears.indexOf(activeYear);
                                    if (idx < allYears.length - 1) setActiveYear(allYears[idx + 1]);
                                }}
                                disabled={allYears.indexOf(activeYear) >= allYears.length - 1}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, display: 'flex', opacity: allYears.indexOf(activeYear) >= allYears.length - 1 ? 0.3 : 1 }}
                            ><ChevronLeft size={18} /></button>
                            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, minWidth: 52, textAlign: 'center' }}>{activeYear}</span>
                            <button
                                onClick={() => {
                                    const idx = allYears.indexOf(activeYear);
                                    if (idx > 0) setActiveYear(allYears[idx - 1]);
                                }}
                                disabled={allYears.indexOf(activeYear) <= 0}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, display: 'flex', opacity: allYears.indexOf(activeYear) <= 0 ? 0.3 : 1 }}
                            ><ChevronRight size={18} /></button>
                        </div>
                    )}
                </div>

                {/* Films / TV Shows tab switcher */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', marginBottom: 'var(--space-xl)' }}>
                    {([
                        { key: 'movies' as const, label: 'Films',    icon: <Film size={14} />, count: entries.length },
                        { key: 'shows'  as const, label: 'TV Shows', icon: <Tv   size={14} />, count: showEntries.length },
                    ]).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setDiaryTab(t.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '0.65rem 1.25rem',
                                fontSize: 'var(--text-sm)', fontWeight: 600,
                                color: diaryTab === t.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                borderBottom: diaryTab === t.key ? '2px solid var(--brand)' : '2px solid transparent',
                                marginBottom: '-1px', background: 'none', cursor: 'pointer',
                                transition: 'color 0.1s',
                            }}
                        >
                            {t.icon} {t.label}
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 999, padding: '1px 6px' }}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>

                {activeCount === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
                        {diaryTab === 'movies' ? (
                            <>
                                <Film size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto var(--space-md)' }} />
                                <p style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 'var(--space-md)' }}>No films logged yet</p>
                                <Link href="/movies" className="btn btn-primary btn-sm">Browse Films</Link>
                            </>
                        ) : (
                            <>
                                <Tv size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto var(--space-md)' }} />
                                <p style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 'var(--space-md)' }}>No shows logged yet</p>
                                <Link href="/shows" className="btn btn-primary btn-sm">Browse TV Shows</Link>
                            </>
                        )}
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
                        <p style={{ fontWeight: 600 }}>Nothing logged in {activeYear}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3xl)' }}>
                        {filteredGroups.map(group => (
                            <section key={group.key}>
                                {/* Month header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                                    marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-sm)',
                                    borderBottom: '1px solid var(--border-subtle)',
                                }}>
                                    <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                                        {group.label}
                                    </h2>
                                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                        {group.entries.length} {itemLabel}{group.entries.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Entries */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {diaryTab === 'movies'
                                        ? (group as MonthGroup<DiaryEntry>).entries.map(entry => {
                                            const d = new Date(entry.watchedAt);
                                            const day = d.getDate();
                                            const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
                                            const href = `/movies/${entry.movie.tmdbId ?? entry.movie.id}`;
                                            const poster = entry.movie.customPosters?.[0]?.posterUrl ?? entry.movie.posterUrl;
                                            return (
                                                <Link key={entry.id} href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '52px 48px 1fr auto', alignItems: 'center', gap: 'var(--space-md)', padding: '10px var(--space-md)', borderRadius: 'var(--radius-md)', transition: 'background 0.1s', cursor: 'pointer' }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>{weekday}</div>
                                                            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)' }}>{day}</div>
                                                        </div>
                                                        <div style={{ width: 36, height: 54, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
                                                            {poster
                                                                ? <img src={poster} alt={entry.movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={14} style={{ opacity: 0.3 }} /></div>
                                                            }
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.movie.title}</p>
                                                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>{entry.movie.year}</p>
                                                        </div>
                                                        <div style={{ flexShrink: 0 }}>
                                                            {entry.rating != null
                                                                ? <StarMini value={entry.rating} />
                                                                : <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>no rating</span>
                                                            }
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                          })
                                        : (group as MonthGroup<ShowDiaryEntry>).entries.map(entry => <ShowRow key={entry.id} entry={entry} />)
                                    }
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
