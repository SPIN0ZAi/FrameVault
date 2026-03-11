'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { List, Plus, Lock, Globe, Film, Star, Loader2, X, Heart } from 'lucide-react';

interface ListItem {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    user: { id: string; username: string; avatarUrl: string | null };
    _count: { movies: number; likes: number };
}

export default function ListsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [lists, setLists] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPublic, setNewPublic] = useState(true);
    const [creating, setCreating] = useState(false);

    const fetchLists = async () => {
        const res = await fetch('/api/lists');
        const data = await res.json();
        if (data.success) setLists(data.data);
        setLoading(false);
    };

    useEffect(() => { fetchLists(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setCreating(true);
        const res = await fetch('/api/lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle, description: newDesc, isPublic: newPublic }),
        });
        const data = await res.json();
        setCreating(false);
        if (data.success) {
            setShowCreate(false);
            setNewTitle(''); setNewDesc('');
            router.push(`/lists/${data.data.id}`);
        }
    };

    const myLists = lists.filter((l) => l.user.id === session?.user?.id);
    const otherLists = lists.filter((l) => l.user.id !== session?.user?.id);

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
                    <div>
                        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <List size={32} style={{ color: 'var(--brand)' }} />
                            Lists
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 'var(--text-sm)' }}>
                            Curated collections by the community
                        </p>
                    </div>
                    {session && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowCreate(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <Plus size={18} /> New List
                        </button>
                    )}
                </div>

                {/* Featured: Top 250 */}
                <section style={{ marginBottom: 'var(--space-3xl)' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
                        Featured
                    </h2>
                    <Link href="/lists/top-250" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #1a1d21 0%, #2c3136 100%)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-xl)',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, transform 0.2s',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
                        >
                            {/* Gold accent bar */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom, #f59e0b, #ef4444)' }} />
                            <div style={{ paddingLeft: 'var(--space-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <Star size={22} fill="#f59e0b" color="#f59e0b" />
                                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Global · Official</span>
                                </div>
                                <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 8 }}>
                                    Top 250 Films of All Time
                                </h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: 560 }}>
                                    The 250 highest-rated films on TMDB — from timeless classics to modern masterpieces. Updated weekly.
                                </p>
                                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--brand)' }}>250 films →</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </section>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
                        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
                    </div>
                ) : (
                    <>
                        {/* My Lists */}
                        {myLists.length > 0 && (
                            <section style={{ marginBottom: 'var(--space-3xl)' }}>
                                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>My Lists</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                                    {myLists.map((list) => <ListCard key={list.id} list={list} />)}
                                </div>
                            </section>
                        )}

                        {/* Community Lists */}
                        {otherLists.length > 0 && (
                            <section>
                                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Community Lists</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                                    {otherLists.map((list) => <ListCard key={list.id} list={list} />)}
                                </div>
                            </section>
                        )}

                        {lists.length === 0 && !session && (
                            <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-secondary)' }}>
                                <Film size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
                                <p>No community lists yet. <Link href="/login" style={{ color: 'var(--brand)' }}>Log in</Link> to create one.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create List Modal */}
            {showCreate && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}
                    onClick={() => setShowCreate(false)}
                >
                    <div
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: 440 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
                            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Create New List</h2>
                            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Title *</label>
                                <input
                                    className="input"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. Favourite Sci-Fi Films"
                                    maxLength={200}
                                    style={{ width: '100%' }}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
                                <textarea
                                    className="input"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Optional description..."
                                    style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                                />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                                <input type="checkbox" checked={newPublic} onChange={(e) => setNewPublic(e.target.checked)} />
                                <Globe size={15} style={{ color: 'var(--text-tertiary)' }} />
                                Make this list public
                            </label>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!newTitle.trim() || creating} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {creating && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                                    {creating ? 'Creating…' : 'Create List'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ListCard({ list }: { list: ListItem }) {
    return (
        <Link href={`/lists/${list.id}`} style={{ textDecoration: 'none' }}>
            <div
                className="card"
                style={{ cursor: 'pointer', height: '100%', transition: 'border-color 0.2s', borderColor: 'var(--border-default)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 'var(--text-base)', lineHeight: 1.3 }}>{list.title}</h3>
                    {list.isPublic
                        ? <Globe size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} />
                        : <Lock size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} />
                    }
                </div>
                {list.description && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {list.description}
                    </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-primary)', flexShrink: 0 }}>
                            {list.user.avatarUrl
                                ? <img src={list.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--brand)' }}>{list.user.username.charAt(0).toUpperCase()}</div>
                            }
                        </div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>@{list.user.username}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Film size={11} /> {list._count.movies}
                        </span>
                        {list._count.likes > 0 && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Heart size={11} /> {list._count.likes}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
