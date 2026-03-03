'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Star, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface MonthGroup {
    key: string;       // "2026-03"
    label: string;     // "March 2026"
    entries: DiaryEntry[];
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

function groupByMonth(entries: DiaryEntry[]): MonthGroup[] {
    const map = new Map<string, DiaryEntry[]>();
    for (const e of entries) {
        const d = new Date(e.watchedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(e);
    }
    const groups: MonthGroup[] = [];
    for (const [key, items] of map) {
        const [year, month] = key.split('-').map(Number);
        groups.push({ key, label: `${MONTH_NAMES[month - 1]} ${year}`, entries: items });
    }
    // newest first
    return groups.sort((a, b) => b.key.localeCompare(a.key));
}

export default function DiaryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/login'); return; }
        if (status !== 'authenticated') return;

        fetch(`/api/users/${session.user.username}/watched?limit=500&sort=date_desc`)
            .then(r => r.json())
            .then(d => { if (d.success) setEntries(d.data); })
            .finally(() => setLoading(false));
    }, [status, session, router]);

    const groups = groupByMonth(entries);
    const years = [...new Set(groups.map(g => parseInt(g.key.split('-')[0])))].sort((a, b) => b - a);
    const filteredGroups = groups.filter(g => parseInt(g.key.split('-')[0]) === activeYear);

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <BookOpen size={28} style={{ color: 'var(--brand)' }} />
                        <div>
                            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, lineHeight: 1 }}>Diary</h1>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                {entries.length} film{entries.length !== 1 ? 's' : ''} logged
                            </p>
                        </div>
                    </div>

                    {/* Year switcher */}
                    {years.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <button
                                onClick={() => {
                                    const idx = years.indexOf(activeYear);
                                    if (idx < years.length - 1) setActiveYear(years[idx + 1]);
                                }}
                                disabled={years.indexOf(activeYear) >= years.length - 1}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, display: 'flex', opacity: years.indexOf(activeYear) >= years.length - 1 ? 0.3 : 1 }}
                            ><ChevronLeft size={18} /></button>
                            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, minWidth: 52, textAlign: 'center' }}>{activeYear}</span>
                            <button
                                onClick={() => {
                                    const idx = years.indexOf(activeYear);
                                    if (idx > 0) setActiveYear(years[idx - 1]);
                                }}
                                disabled={years.indexOf(activeYear) <= 0}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, display: 'flex', opacity: years.indexOf(activeYear) <= 0 ? 0.3 : 1 }}
                            ><ChevronRight size={18} /></button>
                        </div>
                    )}
                </div>

                {entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
                        <BookOpen size={48} style={{ opacity: 0.2, marginBottom: 'var(--space-md)', margin: '0 auto var(--space-md)' }} />
                        <p style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 'var(--space-md)' }}>No films logged yet</p>
                        <Link href="/movies" className="btn btn-primary btn-sm">Browse Films</Link>
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-tertiary)' }}>
                        <p style={{ fontWeight: 600 }}>No films logged in {activeYear}</p>
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
                                        {group.entries.length} film{group.entries.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Entries */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {group.entries.map(entry => {
                                        const d = new Date(entry.watchedAt);
                                        const day = d.getDate();
                                        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
                                        const href = `/movies/${entry.movie.tmdbId ?? entry.movie.id}`;
                                        const poster = entry.movie.customPosters?.[0]?.posterUrl ?? entry.movie.posterUrl;
                                        return (
                                            <Link
                                                key={entry.id}
                                                href={href}
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                <div style={{
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
                                                    {/* Date column */}
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>{weekday}</div>
                                                        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)' }}>{day}</div>
                                                    </div>

                                                    {/* Poster */}
                                                    <div style={{ width: 36, height: 54, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
                                                        {poster
                                                            ? <img src={poster} alt={entry.movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Film size={14} style={{ opacity: 0.3 }} />
                                                            </div>
                                                        }
                                                    </div>

                                                    {/* Title + year */}
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {entry.movie.title}
                                                        </p>
                                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                            {entry.movie.year}
                                                        </p>
                                                    </div>

                                                    {/* Rating */}
                                                    <div style={{ flexShrink: 0 }}>
                                                        {entry.rating != null
                                                            ? <StarMini value={entry.rating} />
                                                            : <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>no rating</span>
                                                        }
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
