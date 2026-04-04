'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Film, Tv, MessageSquare, Star, Users, Trophy, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
    user: {
        id: string;
        username: string;
        avatarUrl: string | null;
        profile: { themeColor: string } | null;
    };
    value: number;
    label: string;
}

const CATEGORIES = [
    { key: 'films_alltime', label: 'Most Films', icon: <Film size={15} />, color: '#00D1C1', format: (v: number) => v.toLocaleString() },
    { key: 'films_month', label: 'This Month', icon: <TrendingUp size={15} />, color: '#f59e0b', format: (v: number) => v.toLocaleString() },
    { key: 'shows_alltime', label: 'Most TV Shows', icon: <Tv size={15} />, color: '#22c55e', format: (v: number) => v.toLocaleString() },
    { key: 'shows_month', label: 'TV This Month', icon: <Tv size={15} />, color: '#14b8a6', format: (v: number) => v.toLocaleString() },
    { key: 'reviews', label: 'Reviews', icon: <MessageSquare size={15} />, color: '#8b5cf6', format: (v: number) => v.toLocaleString() },
    { key: 'avg_rating', label: 'Avg Rating', icon: <Star size={15} />, color: '#f43f5e', format: (v: number) => `${v.toFixed(1)} ★` },
    { key: 'followers', label: 'Most Followed', icon: <Users size={15} />, color: '#3b82f6', format: (v: number) => v.toLocaleString() },
] as const;

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function LeaderboardPage() {
    const [activeCategory, setActiveCategory] = useState<string>('films_alltime');
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [cache, setCache] = useState<Record<string, LeaderboardEntry[]>>({});

    useEffect(() => {
        if (cache[activeCategory]) {
            setData(cache[activeCategory]);
            return;
        }
        setLoading(true);
        fetch(`/api/leaderboard?category=${activeCategory}`)
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setData(d.data);
                    setCache(prev => ({ ...prev, [activeCategory]: d.data }));
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

    const cat = CATEGORIES.find(c => c.key === activeCategory)!;
    const now = new Date();
    const monthLabel = now.toLocaleString('en-US', { month: 'long' });
    const isMonthlyCategory = activeCategory === 'films_month' || activeCategory === 'shows_month';
    const emptyTitle = isMonthlyCategory
        ? `No activity logged for ${monthLabel} yet`
        : 'No data yet';
    const emptySubtitle = activeCategory === 'shows_month'
        ? 'Log a TV watch, rating, or review to appear here.'
        : activeCategory === 'films_month'
            ? 'Log a movie watch, rating, or review to appear here.'
            : 'Be the first on the leaderboard!';
    const top3 = data.slice(0, 3);
    const rest = data.slice(3);

    // Reorder top 3 podium: 2nd, 1st, 3rd
    const podium = top3.length >= 3
        ? [top3[1], top3[0], top3[2]]
        : top3;

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 720 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                        <Trophy size={32} style={{ color: '#FFD700' }} />
                        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>Leaderboard</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
                        Top members across the community
                    </p>
                </div>

                {/* Category tabs */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'var(--space-2xl)' }}>
                    {CATEGORIES.map(c => (
                        <button key={c.key} onClick={() => setActiveCategory(c.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 999,
                                fontSize: 'var(--text-sm)', fontWeight: activeCategory === c.key ? 700 : 500,
                                background: activeCategory === c.key ? c.color : 'var(--bg-secondary)',
                                color: activeCategory === c.key ? '#000' : 'var(--text-secondary)',
                                border: activeCategory === c.key ? `1.5px solid ${c.color}` : '1.5px solid var(--border-default)',
                                boxShadow: activeCategory === c.key ? `0 0 12px ${c.color}55` : 'none',
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                            {c.icon} {c.label}
                        </button>
                    ))}
                </div>

                {isMonthlyCategory && (
                    <p style={{ textAlign: 'center', marginTop: '-8px', marginBottom: 'var(--space-xl)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                        Showing activity logged since {monthLabel} 1.
                    </p>
                )}

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-lg)' }} />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-tertiary)' }}>
                        <Trophy size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p style={{ fontWeight: 700 }}>{emptyTitle}</p>
                        <p style={{ fontSize: 'var(--text-sm)', marginTop: 8 }}>{emptySubtitle}</p>
                    </div>
                ) : (
                    <>
                        {/* Podium — top 3 */}
                        {top3.length >= 2 && (
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
                                {podium.map((entry, podiumIdx) => {
                                    const rank = top3.indexOf(entry); // 0=gold 1=silver 2=bronze
                                    const isGold = rank === 0;
                                    const accent = entry.user.profile?.themeColor || 'var(--brand)';
                                    const heights = [160, 200, 140]; // silver, gold, bronze height
                                    const h = heights[podiumIdx] ?? 160;
                                    return (
                                        <div key={entry.user.id} style={{ flex: 1, maxWidth: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                            {/* Medal */}
                                            <span style={{ fontSize: 28 }}>{MEDALS[rank]}</span>
                                            {/* Avatar */}
                                            <Link href={`/users/${entry.user.username}`}>
                                                {entry.user.avatarUrl ? (
                                                    <img src={entry.user.avatarUrl} alt={entry.user.username}
                                                        style={{ width: isGold ? 72 : 56, height: isGold ? 72 : 56, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${RANK_COLORS[rank]}`, boxShadow: `0 0 18px ${RANK_COLORS[rank]}66` }} />
                                                ) : (
                                                    <div style={{ width: isGold ? 72 : 56, height: isGold ? 72 : 56, borderRadius: '50%', background: `${accent}22`, border: `3px solid ${RANK_COLORS[rank]}`, boxShadow: `0 0 18px ${RANK_COLORS[rank]}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: isGold ? 28 : 22, color: accent }}>
                                                        {entry.user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </Link>
                                            <Link href={`/users/${entry.user.username}`} style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', textAlign: 'center' }}>
                                                {entry.user.username}
                                            </Link>
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>{entry.label}</span>
                                            {/* Podium block */}
                                            <div style={{ width: '100%', height: h, background: `linear-gradient(to top, ${RANK_COLORS[rank]}33, ${RANK_COLORS[rank]}11)`, border: `1px solid ${RANK_COLORS[rank]}44`, borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: RANK_COLORS[rank] }}>{cat.format(entry.value)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Rows 4–20 */}
                        {rest.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                                {rest.map((entry, i) => {
                                    const rank = i + 4;
                                    const accent = entry.user.profile?.themeColor || 'var(--brand)';
                                    return (
                                        <div key={entry.user.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                                            <span style={{ width: 28, textAlign: 'center', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', flexShrink: 0 }}>#{rank}</span>
                                            {entry.user.avatarUrl ? (
                                                <img src={entry.user.avatarUrl} alt={entry.user.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}`, flexShrink: 0 }} />
                                            ) : (
                                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${accent}22`, border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: accent, flexShrink: 0 }}>
                                                    {entry.user.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <Link href={`/users/${entry.user.username}`} style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', flex: 1 }}>
                                                {entry.user.username}
                                            </Link>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: cat.color }}>{cat.format(entry.value)}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{entry.label}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
