'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Edit2, Trash2, Film, Tv, Globe, Lock, X, Check, Loader2,
    AlertTriangle, Heart, Copy, GripVertical, Tag, UploadCloud,
    ChevronDown, ChevronUp,
} from 'lucide-react';

interface ListItem {
    id: string;
    tmdbId: number;
    title: string;
    year: number | null;
    posterUrl: string | null;
    position: number;
    note: string | null;
    groupLabel: string | null;
    mediaType: string;
}

interface ClonedFrom {
    id: string;
    title: string;
    user: { username: string };
}

interface ListDetail {
    id: string;
    title: string;
    description: string | null;
    bannerUrl: string | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    likeCount: number;
    likedByMe: boolean;
    watchedCount: number;
    clonedFrom: ClonedFrom | null;
    user: { id: string; username: string; avatarUrl: string | null };
    movies: ListItem[];
}

// Upload helper
async function uploadBanner(file: File, listId: string): Promise<string | null> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'list-banner', listId, contentType: file.type, extension: ext }),
    });
    const presignData = await presignRes.json();
    if (!presignData.success) return null;
    const { uploadUrl, publicUrl } = presignData.data;
    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    return publicUrl as string;
}

// Group items by groupLabel
function groupItems(items: ListItem[]): Map<string, ListItem[]> {
    const map = new Map<string, ListItem[]>();
    for (const item of items) {
        const key = item.groupLabel ?? '';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
    }
    return map;
}

export default function ListDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: session } = useSession();
    const router = useRouter();
    const [list, setList] = useState<ListDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ListItem[]>([]);

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPublic, setEditPublic] = useState(true);
    const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
    const [editBannerPreview, setEditBannerPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Delete
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Remove item
    const [removingId, setRemovingId] = useState<string | null>(null);

    // Like
    const [likeCount, setLikeCount] = useState(0);
    const [likedByMe, setLikedByMe] = useState(false);
    const [likingBusy, setLikingBusy] = useState(false);

    // Clone
    const [cloning, setCloning] = useState(false);
    const [cloneSuccess, setCloneSuccess] = useState(false);

    // Reorder
    const [reorderMode, setReorderMode] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [savingOrder, setSavingOrder] = useState(false);
    const dragOverId = useRef<string | null>(null);

    // Group label editing
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [groupLabelInput, setGroupLabelInput] = useState('');

    // Collapsed groups
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const fetchList = useCallback(async () => {
        const res = await fetch(`/api/lists/${id}`);
        const data = await res.json();
        if (data.success) {
            const l: ListDetail = data.data;
            setList(l);
            setItems(l.movies);
            setEditTitle(l.title);
            setEditDesc(l.description || '');
            setEditPublic(l.isPublic);
            setEditBannerPreview(l.bannerUrl);
            setLikeCount(l.likeCount);
            setLikedByMe(l.likedByMe);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => { fetchList(); }, [fetchList]);

    const isOwner = session?.user?.id === list?.user?.id;

    const handleSave = async () => {
        setSaving(true);
        let bannerUrl: string | null | undefined = undefined;
        if (editBannerFile) {
            bannerUrl = await uploadBanner(editBannerFile, id);
        } else if (editBannerPreview === null && list?.bannerUrl) {
            bannerUrl = null;
        }
        const res = await fetch(`/api/lists/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: editTitle, description: editDesc, isPublic: editPublic, ...(bannerUrl !== undefined && { bannerUrl }) }),
        });
        const data = await res.json();
        if (data.success) {
            const newBanner = bannerUrl !== undefined ? bannerUrl : (list?.bannerUrl ?? null);
            setList((prev) => prev ? { ...prev, title: editTitle, description: editDesc || null, isPublic: editPublic, bannerUrl: newBanner } : prev);
            setEditBannerFile(null);
            setEditing(false);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        await fetch(`/api/lists/${id}`, { method: 'DELETE' });
        router.push('/lists');
    };

    const handleRemoveItem = async (tmdbId: number, mediaType: string) => {
        const key = `${tmdbId}:${mediaType}`;
        setRemovingId(key);
        await fetch(`/api/lists/${id}/movies/${tmdbId}?mediaType=${mediaType}`, { method: 'DELETE' });
        const next = items.filter((m) => !(m.tmdbId === tmdbId && m.mediaType === mediaType));
        setItems(next);
        setList((prev) => prev ? { ...prev, movies: next } : prev);
        setRemovingId(null);
    };

    const handleLike = async () => {
        if (!session || likingBusy) return;
        setLikingBusy(true);
        const method = likedByMe ? 'DELETE' : 'POST';
        const res = await fetch(`/api/lists/${id}/like`, { method });
        const data = await res.json();
        if (data.success) { setLikeCount(data.data.likeCount); setLikedByMe(data.data.liked); }
        setLikingBusy(false);
    };

    const handleClone = async () => {
        if (!session) { router.push('/login'); return; }
        setCloning(true);
        const res = await fetch(`/api/lists/${id}/clone`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            setCloneSuccess(true);
            setTimeout(() => router.push(`/lists/${data.data.id}`), 1000);
        }
        setCloning(false);
    };

    const handleDragStart = (itemId: string) => setDraggingId(itemId);
    const handleDragOver = (e: React.DragEvent, itemId: string) => { e.preventDefault(); dragOverId.current = itemId; };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggingId || !dragOverId.current || draggingId === dragOverId.current) { setDraggingId(null); return; }
        const next = [...items];
        const fromIdx = next.findIndex((m) => m.id === draggingId);
        const toIdx = next.findIndex((m) => m.id === dragOverId.current);
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        setItems(next);
        setDraggingId(null);
        dragOverId.current = null;
    };

    const handleSaveOrder = async () => {
        setSavingOrder(true);
        await fetch(`/api/lists/${id}/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: items.map((m, idx) => ({ id: m.id, position: idx, groupLabel: m.groupLabel })) }),
        });
        setItems((prev) => prev.map((m, idx) => ({ ...m, position: idx })));
        setSavingOrder(false);
        setReorderMode(false);
    };

    const handleSaveGroupLabel = (itemId: string) => {
        setItems((prev) => prev.map((m) => m.id === itemId ? { ...m, groupLabel: groupLabelInput.trim() || null } : m));
        setEditingGroupId(null);
    };

    const toggleGroup = (groupKey: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupKey)) next.delete(groupKey); else next.add(groupKey);
            return next;
        });
    };

    if (loading) return (
        <div className="page"><div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-3xl)' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
        </div></div>
    );

    if (!list) return (
        <div className="page"><div className="container" style={{ textAlign: 'center' }}>
            <h1 className="page-title">List Not Found</h1>
            <Link href="/lists" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)', display: 'inline-flex' }}>Back to Lists</Link>
        </div></div>
    );

    const bannerSrc = editing ? (editBannerPreview ?? list.bannerUrl) : list.bannerUrl;
    const watchedPct = items.length > 0 ? Math.round((list.watchedCount / items.length) * 100) : 0;
    const grouped = groupItems(items);
    const hasGroups = Array.from(grouped.keys()).some((k) => k !== '');

    return (
        <div className="page" style={{ paddingBottom: 'var(--space-3xl)' }}>

            {/* ── Banner ── */}
            {(bannerSrc || editing) && (
                <div style={{
                    position: 'relative', width: '100%',
                    height: bannerSrc ? 280 : 140,
                    overflow: 'hidden',
                    background: bannerSrc ? 'var(--bg-secondary)' : 'rgba(99,102,241,0.05)',
                    borderBottom: !bannerSrc ? '2px dashed rgba(99,102,241,0.3)' : undefined,
                }}>
                    {bannerSrc && <img src={bannerSrc} alt="List banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                    {!bannerSrc && editing && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No banner — click to upload</span>
                        </div>
                    )}
                    {bannerSrc && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.75) 100%)' }} />}
                    {editing && (
                        <>
                            <button type="button" onClick={() => bannerInputRef.current?.click()} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 'var(--radius-md)', padding: '6px 14px', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <UploadCloud size={14} /> {bannerSrc ? 'Change' : 'Upload Banner'}
                            </button>
                            {bannerSrc && (
                                <button type="button" onClick={() => { setEditBannerFile(null); setEditBannerPreview(null); }} style={{ position: 'absolute', top: 12, right: 155, background: 'rgba(239,68,68,0.75)', border: 'none', borderRadius: 'var(--radius-md)', padding: '6px 14px', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <X size={12} /> Remove
                                </button>
                            )}
                            <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setEditBannerFile(file);
                                    setEditBannerPreview(URL.createObjectURL(file));
                                }}
                            />
                        </>
                    )}
                </div>
            )}

            <div className="container" style={{ marginTop: bannerSrc ? '-48px' : 'var(--space-xl)', position: 'relative', zIndex: 1 }}>
                <Link href="/lists" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: bannerSrc ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-lg)', textDecoration: 'none' }}>
                    <ArrowLeft size={15} /> Back to Lists
                </Link>

                {/* ── Header ── */}
                <div style={{ marginBottom: 'var(--space-2xl)', paddingBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border-default)' }}>
                    {editing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: 600, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', border: '1px solid var(--border-default)' }}>
                            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Edit List</h3>
                            <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="List title" maxLength={200} autoFocus />
                            <textarea className="input" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description — tell people what this list is about…" style={{ minHeight: 90, resize: 'vertical', lineHeight: 1.6 }} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                                <input type="checkbox" checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} />
                                <Globe size={15} style={{ color: 'var(--text-tertiary)' }} /> Make public
                            </label>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!editTitle.trim() || saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                                    <Check size={14} /> Save
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setEditBannerFile(null); setEditBannerPreview(list.bannerUrl); }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {list.clonedFrom && (
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                                    Cloned from <Link href={`/lists/${list.clonedFrom.id}`} style={{ color: 'var(--brand)' }}>{list.clonedFrom.title}</Link>{' '}
                                    by <Link href={`/users/${list.clonedFrom.user.username}`} style={{ color: 'var(--brand)' }}>@{list.clonedFrom.user.username}</Link>
                                </p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        {list.isPublic ? <Globe size={13} style={{ color: 'var(--text-tertiary)' }} /> : <Lock size={13} style={{ color: 'var(--text-tertiary)' }} />}
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                            {list.isPublic ? 'Public' : 'Private'} list by{' '}
                                            <Link href={`/users/${list.user.username}`} style={{ color: 'var(--brand)' }}>@{list.user.username}</Link>
                                        </span>
                                    </div>
                                    <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>{list.title}</h1>
                                    {list.description && (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 640, lineHeight: 1.7, marginBottom: 14 }}>{list.description}</p>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                                        {session && items.length > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                                                    <div style={{ width: `${watchedPct}%`, height: '100%', background: 'var(--brand)', borderRadius: 99, transition: 'width 0.4s' }} />
                                                </div>
                                                <span style={{ fontSize: 'var(--text-xs)', color: watchedPct === 100 ? 'var(--brand)' : 'var(--text-tertiary)', fontWeight: 600 }}>
                                                    {list.watchedCount}/{items.length} watched ({watchedPct}%)
                                                </span>
                                            </div>
                                        )}
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Heart size={12} fill={likedByMe ? '#ef4444' : 'none'} color={likedByMe ? '#ef4444' : 'currentColor'} />
                                            {likeCount} like{likeCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <button onClick={handleLike} disabled={likingBusy || !session} title={session ? (likedByMe ? 'Unlike' : 'Like this list') : 'Log in to like'} style={{ display: 'flex', alignItems: 'center', gap: 6, background: likedByMe ? 'rgba(239,68,68,0.15)' : 'var(--bg-secondary)', border: `1px solid ${likedByMe ? 'rgba(239,68,68,0.4)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-full)', padding: '7px 14px', cursor: session ? 'pointer' : 'default', fontSize: 'var(--text-sm)', fontWeight: 600, color: likedByMe ? '#ef4444' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                                        <Heart size={15} fill={likedByMe ? '#ef4444' : 'none'} color={likedByMe ? '#ef4444' : 'currentColor'} />
                                        {likedByMe ? 'Liked' : 'Like'}
                                    </button>
                                    <button onClick={handleClone} disabled={cloning || cloneSuccess} title="Clone this list" style={{ display: 'flex', alignItems: 'center', gap: 6, background: cloneSuccess ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)', padding: '7px 14px', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, color: cloneSuccess ? 'var(--brand)' : 'var(--text-secondary)' }}>
                                        {cloning ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Copy size={14} />}
                                        {cloneSuccess ? 'Cloned!' : 'Clone'}
                                    </button>
                                    {isOwner && (
                                        <>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setReorderMode((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <GripVertical size={14} /> {reorderMode ? 'Exit Reorder' : 'Reorder'}
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            <button onClick={() => setShowDelete(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: '6px 12px', cursor: 'pointer', color: '#ef4444' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Reorder bar ── */}
                {reorderMode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-md)', padding: '10px 16px' }}>
                        <GripVertical size={16} style={{ color: 'var(--brand)' }} />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', flex: 1 }}>
                            <strong>Drag items</strong> to reorder. Click <Tag size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> to assign a <strong>group label</strong> (e.g. &quot;Prequel Trilogy&quot;).
                        </span>
                        <button className="btn btn-primary btn-sm" onClick={handleSaveOrder} disabled={savingOrder} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {savingOrder && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                            <Check size={13} /> Save Order
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setReorderMode(false); setItems(list.movies); }}>Cancel</button>
                    </div>
                )}

                {/* ── Empty state ── */}
                {items.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-secondary)' }}>
                        <Film size={48} style={{ opacity: 0.25, marginBottom: 'var(--space-md)' }} />
                        <p style={{ fontWeight: 600 }}>No items in this list yet</p>
                        {isOwner && (
                            <p style={{ fontSize: 'var(--text-sm)', marginTop: 8 }}>
                                Browse <Link href="/movies" style={{ color: 'var(--brand)' }}>movies</Link> or{' '}
                                <Link href="/shows" style={{ color: 'var(--brand)' }}>TV shows</Link> and click <strong>Add to List</strong> to get started.
                            </p>
                        )}
                    </div>
                )}

                {/* ── Reorder list view ── */}
                {reorderMode && items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {items.map((item, idx) => {
                            const isShow = item.mediaType === 'show';
                            const isDragging = draggingId === item.id;
                            return (
                                <div key={item.id} draggable onDragStart={() => handleDragStart(item.id)} onDragOver={(e) => handleDragOver(e, item.id)} onDrop={handleDrop} onDragEnd={() => setDraggingId(null)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', background: isDragging ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)', border: `1px solid ${isDragging ? 'var(--brand)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-md)', padding: '8px 12px', cursor: 'grab', opacity: isDragging ? 0.5 : 1, transition: 'all 0.1s' }}
                                >
                                    <GripVertical size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                    <span style={{ fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', minWidth: 22, textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                                    {item.posterUrl
                                        ? <img src={item.posterUrl} alt="" style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                                        : <div style={{ width: 32, height: 48, background: 'rgba(255,255,255,0.05)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {isShow ? <Tv size={14} style={{ opacity: 0.3 }} /> : <Film size={14} style={{ opacity: 0.3 }} />}
                                          </div>
                                    }
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{item.year}{isShow ? ' · TV' : ''}</div>
                                    </div>
                                    {editingGroupId === item.id ? (
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                            <input className="input" value={groupLabelInput} onChange={(e) => setGroupLabelInput(e.target.value)} placeholder="e.g. Original Trilogy" style={{ fontSize: 12, padding: '4px 8px', width: 180 }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveGroupLabel(item.id); if (e.key === 'Escape') setEditingGroupId(null); }} />
                                            <button onClick={() => handleSaveGroupLabel(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', padding: 4 }}><Check size={14} /></button>
                                            <button onClick={() => setEditingGroupId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setEditingGroupId(item.id); setGroupLabelInput(item.groupLabel ?? ''); }} title="Set group label"
                                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: item.groupLabel ? 'rgba(99,102,241,0.15)' : 'none', border: item.groupLabel ? '1px solid rgba(99,102,241,0.3)' : '1px dashed var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '3px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: item.groupLabel ? 'var(--brand)' : 'var(--text-tertiary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        >
                                            <Tag size={10} />{item.groupLabel ?? 'Group…'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Normal grid view (with groups) ── */}
                {!reorderMode && items.length > 0 && (
                    <div>
                        {hasGroups ? (
                            Array.from(grouped.entries()).map(([groupKey, gItems]) => (
                                <div key={groupKey} style={{ marginBottom: 'var(--space-2xl)' }}>
                                    {groupKey && (
                                        <button onClick={() => toggleGroup(groupKey)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 'var(--space-md)', width: '100%' }}>
                                            <div style={{ height: 2, width: 18, background: 'var(--brand)', borderRadius: 2, flexShrink: 0 }} />
                                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)', whiteSpace: 'nowrap' }}>{groupKey}</span>
                                            <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{gItems.length}</span>
                                            {collapsedGroups.has(groupKey) ? <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} /> : <ChevronUp size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
                                        </button>
                                    )}
                                    {!collapsedGroups.has(groupKey) && (
                                        <ItemGrid groupItems={gItems} isOwner={isOwner} removingId={removingId} handleRemoveItem={handleRemoveItem} globalOffset={items.indexOf(gItems[0])} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <ItemGrid groupItems={items} isOwner={isOwner} removingId={removingId} handleRemoveItem={handleRemoveItem} globalOffset={0} />
                        )}
                    </div>
                )}

                {isOwner && items.length > 0 && !reorderMode && (
                    <p style={{ marginTop: 'var(--space-xl)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                        Hover a poster and click <strong style={{ color: 'var(--error)' }}>✕</strong> to remove.{' '}
                        Use <strong>Reorder</strong> to drag items and set group labels.{' '}
                        Browse <Link href="/movies" style={{ color: 'var(--brand)' }}>movies</Link> or <Link href="/shows" style={{ color: 'var(--brand)' }}>TV shows</Link> to add more.
                    </p>
                )}
            </div>

            {/* ── Delete Modal ── */}
            {showDelete && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }} onClick={() => setShowDelete(false)}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: 380, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: 'var(--space-md)' }} />
                        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 8 }}>Delete List?</h3>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                            &quot;{list.title}&quot; and all its items will be permanently deleted.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                            <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Cancel</button>
                            <button onClick={handleDelete} disabled={deleting} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ef4444', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>
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

// ─── Item Grid sub-component ──────────────────────────────────────────────────
interface ItemGridProps {
    groupItems: ListItem[];
    isOwner: boolean;
    removingId: string | null;
    handleRemoveItem: (tmdbId: number, mediaType: string) => void;
    globalOffset: number;
}

function ItemGrid({ groupItems, isOwner, removingId, handleRemoveItem, globalOffset }: ItemGridProps) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-md)' }}>
            {groupItems.map((item, idx) => {
                const isShow = item.mediaType === 'show';
                const href = isShow ? `/shows/${item.tmdbId}` : `/movies/${item.tmdbId}`;
                const key = `${item.tmdbId}:${item.mediaType}`;
                return (
                    <div key={key} style={{ position: 'relative' }}>
                        <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <div style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', marginBottom: 8, position: 'relative' }}>
                                {item.posterUrl
                                    ? <img src={item.posterUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isShow ? <Tv size={28} style={{ opacity: 0.3 }} /> : <Film size={28} style={{ opacity: 0.3 }} />}
                                      </div>
                                }
                                <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 800, color: 'white' }}>
                                    {globalOffset + idx + 1}
                                </div>
                                {isShow && (
                                    <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(99,102,241,0.85)', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Tv size={9} /> TV
                                    </div>
                                )}
                            </div>
                            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.title}</p>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{item.year}</p>
                        </Link>
                        {isOwner && (
                            <button
                                onClick={() => handleRemoveItem(item.tmdbId, item.mediaType)}
                                disabled={removingId === key}
                                title="Remove from list"
                                style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: removingId === key ? 0.5 : 0, transition: 'opacity 0.15s' }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = removingId === key ? '0.5' : '0')}
                            >
                                <X size={12} color="white" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
