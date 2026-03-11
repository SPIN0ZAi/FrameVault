'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { List, Plus, Lock, Globe, Film, Star, Loader2, X, Heart, Download, Shield, Bookmark } from 'lucide-react';

interface ListItem {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    isFeatured: boolean;
    isOfficial: boolean;
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
    const [newFeatured, setNewFeatured] = useState(false);
    const [newOfficial, setNewOfficial] = useState(false);
    const [creating, setCreating] = useState(false);

    const isAdmin = session?.user?.role === 'admin';

    // ── Letterboxd import modal ──
    const [showImport, setShowImport]           = useState(false);
    const [importUrl, setImportUrl]             = useState('');
    const [importCustomTitle, setImportCustomTitle] = useState('');
    const [importing, setImporting]             = useState(false);
    const [importMsg, setImportMsg]             = useState<{ ok: boolean; text: string } | null>(null);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importUrl.trim()) return;
        setImporting(true);
        setImportMsg(null);
        try {
            const res = await fetch('/api/letterboxd-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: importUrl, customTitle: importCustomTitle }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setImportMsg({ ok: false, text: data.error || 'Import failed' });
            } else {
                setImportMsg({ ok: true, text: `Imported ${data.added} of ${data.total} films!` });
                await fetchLists();
                setTimeout(() => { router.push(`/lists/${data.listId}`); }, 1200);
            }
        } catch {
            setImportMsg({ ok: false, text: 'Network error — please try again.' });
        } finally {
            setImporting(false);
        }
    };

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
            body: JSON.stringify({ title: newTitle, description: newDesc, isPublic: newPublic, isFeatured: newFeatured, isOfficial: newOfficial }),
        });
        const data = await res.json();
        setCreating(false);
        if (data.success) {
            setShowCreate(false);
            setNewTitle(''); setNewDesc('');
            router.push(`/lists/${data.data.id}`);
        }
    };

    const myLists       = lists.filter((l) => l.user.id === session?.user?.id);
    const featuredLists = lists.filter((l) => l.isFeatured && !l.isOfficial);
    const officialLists = lists.filter((l) => l.isOfficial);
    const communityLists = lists.filter((l) => l.user.id !== session?.user?.id && !l.isFeatured && !l.isOfficial);

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
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => { setShowImport(true); setImportMsg(null); setImportUrl(''); setImportCustomTitle(''); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Download size={15} /> Import from Letterboxd
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowCreate(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Plus size={18} /> New List
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Official & Featured section ── */}
                <section style={{ marginBottom: 'var(--space-3xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-lg)' }}>
                        <Shield size={18} style={{ color: '#f59e0b' }} />
                        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Official &amp; Featured</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                        {/* Always-show Top 250 card */}
                        <Link href="/lists/top-250" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ cursor: 'pointer', height: '100%', background: 'linear-gradient(135deg, #1a1d21 0%, #2c3136 100%)', borderLeft: '3px solid #f59e0b' }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#f59e0b')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Global · Official</span>
                                </div>
                                <h3 style={{ fontWeight: 800, fontSize: 'var(--text-base)', marginBottom: 8 }}>Top 250 Films of All Time</h3>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>The 250 highest-rated films on TMDB. Updated weekly.</p>
                                <p style={{ marginTop: 12, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--brand)' }}>250 films →</p>
                            </div>
                        </Link>
                        {/* Official lists (isOfficial=true) */}
                        {officialLists.map((list) => <ListCard key={list.id} list={list} badge="official" />)}
                        {/* Featured lists (isFeatured=true) */}
                        {featuredLists.map((list) => <ListCard key={list.id} list={list} badge="featured" />)}
                    </div>
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
                        {communityLists.length > 0 && (
                            <section>
                                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Community Lists</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                                    {communityLists.map((list) => <ListCard key={list.id} list={list} />)}
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
                            {session?.user?.role === 'admin' && (
                                <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Options</p>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                                        <input type="checkbox" checked={newFeatured} onChange={(e) => setNewFeatured(e.target.checked)} />
                                        <Star size={15} style={{ color: 'var(--brand)' }} />
                                        Mark as Featured
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                                        <input type="checkbox" checked={newOfficial} onChange={(e) => setNewOfficial(e.target.checked)} />
                                        <Shield size={15} style={{ color: '#f59e0b' }} />
                                        Mark as Official / Global
                                    </label>
                                </div>
                            )}
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

            {/* ── Import from Letterboxd Modal ── */}
            {showImport && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}
                    onClick={() => !importing && setShowImport(false)}
                >
                    <div
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: 480 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Download size={18} style={{ color: 'var(--brand)' }} />
                                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Import from Letterboxd</h2>
                            </div>
                            {!importing && (
                                <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', lineHeight: 1.6 }}>
                            Paste a public Letterboxd list URL and all its films will be added to a new list automatically. Short links (<code>boxd.it/…</code>) also work.
                        </p>

                        <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Letterboxd List URL *</label>
                                <input
                                    className="input"
                                    value={importUrl}
                                    onChange={(e) => setImportUrl(e.target.value)}
                                    placeholder="https://letterboxd.com/username/list/list-name/"
                                    style={{ width: '100%' }}
                                    disabled={importing}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                                    Custom list title <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional — uses Letterboxd title if blank)</span>
                                </label>
                                <input
                                    className="input"
                                    value={importCustomTitle}
                                    onChange={(e) => setImportCustomTitle(e.target.value)}
                                    placeholder="Leave blank to use the original list title"
                                    style={{ width: '100%' }}
                                    disabled={importing}
                                />
                            </div>

                            {importMsg && (
                                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: importMsg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${importMsg.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, fontSize: 'var(--text-sm)', color: importMsg.ok ? 'rgb(34,197,94)' : '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {importMsg.ok ? '✅' : '❌'} {importMsg.text}
                                    {importMsg.ok && <span style={{ marginLeft: 4, opacity: 0.7 }}>Redirecting…</span>}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowImport(false)} disabled={importing}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!importUrl.trim() || importing} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                                    {importing
                                        ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Importing films…</>
                                        : <><Download size={15} /> Import List</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ListCard({ list, badge }: { list: ListItem; badge?: 'official' | 'featured' }) {
    return (
        <Link href={`/lists/${list.id}`} style={{ textDecoration: 'none' }}>
            <div
                className="card"
                style={{ cursor: 'pointer', height: '100%', transition: 'border-color 0.2s', borderColor: badge === 'official' ? '#f59e0b' : badge === 'featured' ? 'var(--brand)' : 'var(--border-default)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = badge === 'official' ? '#f59e0b' : badge === 'featured' ? 'var(--brand)' : 'var(--border-default)')}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: badge ? 6 : 10 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 'var(--text-base)', lineHeight: 1.3 }}>{list.title}</h3>
                    {list.isPublic
                        ? <Globe size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} />
                        : <Lock size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} />
                    }
                </div>
                {badge && (
                    <div style={{ marginBottom: 8 }}>
                        {badge === 'official' && <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🌐 Official</span>}
                        {badge === 'featured' && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>⭐ Featured</span>}
                    </div>
                )}
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
