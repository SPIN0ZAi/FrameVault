'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Users, Film, MessageSquare, TrendingUp, Clock, Star } from 'lucide-react';

interface Member {
    id: string;
    username: string;
    avatarUrl: string | null;
    createdAt: string;
    isFollowing: boolean;
    profile: { bio: string | null; themeColor: string } | null;
    _count: {
        watchedMovies: number;
        reviews: number;
        followers: number;
        following: number;
    };
    watchedMovies: { movie: { posterUrl: string | null; title: string } }[];
}

const SORT_TABS = [
    { key: 'popular', label: 'Popular', icon: <TrendingUp size={14} /> },
    { key: 'newest', label: 'Newest', icon: <Clock size={14} /> },
    { key: 'films', label: 'Most Films', icon: <Film size={14} /> },
] as const;

function MemberCard({ member, currentUserId, onFollowToggle }: {
    member: Member;
    currentUserId?: string;
    onFollowToggle: (id: string, username: string, currentlyFollowing: boolean) => void;
}) {
    const accent = member.profile?.themeColor || '#00D1C1';
    const isSelf = currentUserId === member.id;
    const posters = member.watchedMovies.slice(0, 4).map(wm => wm.movie.posterUrl);

    return (
        <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            transition: 'border-color 0.15s, transform 0.15s',
            display: 'flex', flexDirection: 'column',
        }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
        >
            {/* Recent films strip */}
            <div style={{ display: 'flex', height: 80, background: 'var(--bg-tertiary)', position: 'relative', overflow: 'hidden' }}>
                {posters.length > 0
                    ? posters.map((p, i) => (
                        <div key={i} style={{ flex: 1, overflow: 'hidden' }}>
                            {p ? <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', background: `${accent}22` }} />}
                        </div>
                    ))
                    : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accent}22 0%, var(--bg-tertiary) 100%)` }} />
                }
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)' }} />
            </div>

            {/* Body */}
            <div style={{ padding: 'var(--space-md)', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link href={`/users/${member.username}`} style={{ flexShrink: 0 }}>
                        {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.username} style={{
                                width: 52, height: 52, borderRadius: '50%', objectFit: 'cover',
                                border: `3px solid ${accent}`,
                                boxShadow: `0 0 12px ${accent}55`,
                            }} />
                        ) : (
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%',
                                background: `${accent}22`,
                                border: `3px solid ${accent}`,
                                boxShadow: `0 0 12px ${accent}55`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: 22, color: accent,
                            }}>
                                {member.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/users/${member.username}`} style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.username}
                        </Link>
                        {member.profile?.bio && (
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                                {member.profile.bio}
                            </p>
                        )}
                    </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 0, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {[
                        { icon: <Film size={11} />, value: member._count.watchedMovies, label: 'films' },
                        { icon: <MessageSquare size={11} />, value: member._count.reviews, label: 'reviews' },
                        { icon: <Users size={11} />, value: member._count.followers, label: 'followers' },
                    ].map((s, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', borderRight: i < 2 ? '1px solid var(--border-subtle)' : 'none' }}>
                            <div style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{s.value.toLocaleString()}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>{s.icon}{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Follow button */}
                {currentUserId && !isSelf && (
                    <button
                        onClick={() => onFollowToggle(member.id, member.username, member.isFollowing)}
                        className={`btn btn-sm ${member.isFollowing ? 'btn-ghost' : 'btn-primary'}`}
                        style={!member.isFollowing ? { background: accent, borderColor: accent, width: '100%', justifyContent: 'center' } : { width: '100%', justifyContent: 'center' }}
                    >
                        {member.isFollowing ? 'Following' : '+ Follow'}
                    </button>
                )}
                {!currentUserId && (
                    <Link href={`/users/${member.username}`} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                        View Profile
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function MembersPage() {
    const { data: session } = useSession();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<'popular' | 'newest' | 'films'>('popular');
    const [q, setQ] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ sort, page: page.toString() });
            if (q) params.set('q', q);
            const res = await fetch(`/api/members?${params}`);
            const data = await res.json();
            if (data.success) {
                setMembers(data.data);
                setTotalPages(data.meta?.totalPages ?? 1);
                setTotal(data.meta?.totalCount ?? 0);
            }
        } catch { }
        finally { setLoading(false); }
    }, [sort, page, q]);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    useEffect(() => {
        const t = setTimeout(() => { setQ(searchInput); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    const handleFollow = async (userId: string, username: string, currentlyFollowing: boolean) => {
        if (!session) return;
        setFollowStates(prev => ({ ...prev, [userId]: !currentlyFollowing }));
        setMembers(prev => prev.map(m => m.id === userId ? { ...m, isFollowing: !currentlyFollowing } : m));
        try {
            await fetch(`/api/users/${username}/follow`, { method: currentlyFollowing ? 'DELETE' : 'POST' });
        } catch {
            setFollowStates(prev => ({ ...prev, [userId]: currentlyFollowing }));
            setMembers(prev => prev.map(m => m.id === userId ? { ...m, isFollowing: currentlyFollowing } : m));
        }
    };

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>Members</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
                        Film lovers, critics and friends — find popular members.
                    </p>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
                    {/* Sort tabs */}
                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 4, gap: 2 }}>
                        {SORT_TABS.map(tab => (
                            <button key={tab.key}
                                onClick={() => { setSort(tab.key); setPage(1); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 14px', borderRadius: 'var(--radius-md)',
                                    background: sort === tab.key ? 'var(--brand)' : 'transparent',
                                    color: sort === tab.key ? '#000' : 'var(--text-secondary)',
                                    fontWeight: sort === tab.key ? 700 : 500,
                                    fontSize: 'var(--text-sm)', cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                        <input
                            className="input"
                            placeholder="Find a member…"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            style={{ paddingLeft: 36, width: '100%' }}
                        />
                    </div>

                    {total > 0 && (
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                            {total.toLocaleString()} member{total !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} style={{ height: 280, borderRadius: 'var(--radius-xl)', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        ))}
                    </div>
                ) : members.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-tertiary)' }}>
                        <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>No members found</p>
                        {q && <p style={{ fontSize: 'var(--text-sm)', marginTop: 8 }}>Try a different search</p>}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
                        {members.map(m => (
                            <MemberCard
                                key={m.id}
                                member={{ ...m, isFollowing: followStates[m.id] !== undefined ? followStates[m.id] : m.isFollowing }}
                                currentUserId={session?.user?.id}
                                onFollowToggle={handleFollow}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-2xl)', alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', padding: '0 var(--space-md)' }}>Page {page} of {totalPages}</span>
                        <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}
