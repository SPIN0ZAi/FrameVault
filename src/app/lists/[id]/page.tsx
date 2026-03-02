'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Film, Globe, Lock, Plus, X, Check, Loader2, AlertTriangle } from 'lucide-react';

interface ListMovie {
    id: string;
    tmdbId: number;
    title: string;
    year: number | null;
    posterUrl: string | null;
    position: number;
    note: string | null;
}

interface ListDetail {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    user: { id: string; username: string; avatarUrl: string | null };
    movies: ListMovie[];
}

export default function ListDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: session } = useSession();
    const router = useRouter();
    const [list, setList] = useState<ListDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPublic, setEditPublic] = useState(true);
    const [saving, setSaving] = useState(false);

    // Delete confirmation
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Removing a movie
    const [removingId, setRemovingId] = useState<number | null>(null);

    const fetchList = useCallback(async () => {
        const res = await fetch(`/api/lists/${id}`);
        const data = await res.json();
        if (data.success) {
            setList(data.data);
            setEditTitle(data.data.title);
            setEditDesc(data.data.description || '');
            setEditPublic(data.data.isPublic);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => { fetchList(); }, [fetchList]);

    const isOwner = session?.user?.id === list?.user?.id;

    const handleSave = async () => {
        setSaving(true);
        const res = await fetch(`/api/lists/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: editTitle, description: editDesc, isPublic: editPublic }),
        });
        const data = await res.json();
        if (data.success) {
            setList((prev) => prev ? { ...prev, title: editTitle, description: editDesc || null, isPublic: editPublic } : prev);
            setEditing(false);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        await fetch(`/api/lists/${id}`, { method: 'DELETE' });
        router.push('/lists');
    };

    const handleRemoveMovie = async (tmdbId: number) => {
        setRemovingId(tmdbId);
        await fetch(`/api/lists/${id}/movies/${tmdbId}`, { method: 'DELETE' });
        setList((prev) => prev ? { ...prev, movies: prev.movies.filter((m) => m.tmdbId !== tmdbId) } : prev);
        setRemovingId(null);
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-3xl)' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
                </div>
            </div>
        );
    }

    if (!list) {
        return (
            <div className="page">
                <div className="container" style={{ textAlign: 'center' }}>
                    <h1 className="page-title">List Not Found</h1>
                    <Link href="/lists" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)', display: 'inline-flex' }}>Back to Lists</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <Link href="/lists" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-lg)', textDecoration: 'none' }}>
                    <ArrowLeft size={15} /> Back to Lists
                </Link>

                {/* Header */}
                <div style={{ marginBottom: 'var(--space-2xl)', paddingBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border-default)' }}>
                    {editing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: 560 }}>
                            <input
                                className="input"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}
                                maxLength={200}
                                autoFocus
                            />
                            <textarea
                                className="input"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Description (optional)"
                                style={{ minHeight: 80, resize: 'vertical' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                                <input type="checkbox" checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} />
                                <Globe size={15} style={{ color: 'var(--text-tertiary)' }} /> Make public
                            </label>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!editTitle.trim() || saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                                    <Check size={14} /> Save
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        {list.isPublic
                                            ? <Globe size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            : <Lock size={14} style={{ color: 'var(--text-tertiary)' }} />
                                        }
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                            {list.isPublic ? 'Public' : 'Private'} list by{' '}
                                            <Link href={`/users/${list.user.username}`} style={{ color: 'var(--brand)' }}>@{list.user.username}</Link>
                                        </span>
                                    </div>
                                    <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>{list.title}</h1>
                                    {list.description && (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 600, lineHeight: 1.6 }}>{list.description}</p>
                                    )}
                                    <p style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                        {list.movies.length} film{list.movies.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                {isOwner && (
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => setShowDelete(true)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: '6px 14px', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, color: '#ef4444' }}
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Movies grid */}
                {list.movies.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-secondary)' }}>
                        <Film size={48} style={{ opacity: 0.25, marginBottom: 'var(--space-md)' }} />
                        <p style={{ fontWeight: 600 }}>No films in this list yet</p>
                        {isOwner && (
                            <p style={{ fontSize: 'var(--text-sm)', marginTop: 8 }}>
                                Browse <Link href="/movies" style={{ color: 'var(--brand)' }}>movies</Link> and click{' '}
                                <strong>Add to List</strong> to start building your collection.
                            </p>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-md)' }}>
                        {list.movies.map((movie, idx) => (
                            <div key={movie.tmdbId} style={{ position: 'relative' }}>
                                <Link href={`/movies/${movie.tmdbId}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                    <div style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', marginBottom: 8 }}>
                                        {movie.posterUrl
                                            ? <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={28} style={{ opacity: 0.3 }} /></div>
                                        }
                                        {/* Position badge */}
                                        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 700, color: 'white' }}>
                                            {idx + 1}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{movie.title}</p>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{movie.year}</p>
                                </Link>
                                {isOwner && (
                                    <button
                                        onClick={() => handleRemoveMovie(movie.tmdbId)}
                                        disabled={removingId === movie.tmdbId}
                                        title="Remove from list"
                                        style={{
                                            position: 'absolute', top: 6, right: 6,
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: 'rgba(239,68,68,0.85)',
                                            border: 'none', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            opacity: removingId === movie.tmdbId ? 0.5 : 0,
                                            transition: 'opacity 0.15s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                                        className="remove-btn"
                                    >
                                        <X size={12} color="white" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Hint for owner */}
                {isOwner && list.movies.length > 0 && (
                    <p style={{ marginTop: 'var(--space-xl)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                        Hover over a poster and click <strong style={{ color: 'var(--error)' }}>✕</strong> to remove a film. <Link href="/movies" style={{ color: 'var(--brand)' }}>Browse movies</Link> to add more.
                    </p>
                )}
            </div>

            {/* Delete Confirm Modal */}
            {showDelete && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}
                    onClick={() => setShowDelete(false)}
                >
                    <div
                        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: 380, textAlign: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: 'var(--space-md)' }} />
                        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 8 }}>Delete List?</h3>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                            "{list.title}" and all its films will be permanently deleted.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                            <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Cancel</button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ef4444', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                {deleting && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
