'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    ArrowLeft, Upload, Film, Star, BookmarkPlus, MessageSquare,
    Check, X, Loader2, AlertTriangle, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── CSV parsing ─────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += c;
        }
    }
    result.push(current.trim());
    return result;
}

function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    return lines.slice(1).map((line) => {
        const values = parseCSVLine(line);
        return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    });
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImportMovie {
    title: string;
    year: number;
    watched: boolean;
    watchedDate?: string;
    rating?: number;   // 1–10
    review?: string;
    watchlist: boolean;
}

type ImportStatus = 'pending' | 'running' | 'imported' | 'not_found' | 'error';

interface ImportItem extends ImportMovie {
    status: ImportStatus;
    actions: string[];
    error?: string;
}

// ─── Merge helper ────────────────────────────────────────────────────────────

function buildKey(title: string, year: number) {
    return `${title.toLowerCase().trim()}|${year}`;
}

function mergeCSVs(files: Record<string, Record<string, string>[]>): ImportMovie[] {
    const map = new Map<string, ImportMovie>();

    const upsert = (title: string, yearStr: string): ImportMovie => {
        const year = parseInt(yearStr) || 0;
        const key = buildKey(title, year);
        if (!map.has(key)) {
            map.set(key, { title, year, watched: false, watchlist: false });
        }
        return map.get(key)!;
    };

    // watched.csv / diary.csv
    for (const row of files.watched ?? []) {
        if (!row.name) continue;
        const m = upsert(row.name, row.year);
        m.watched = true;
        if (row['watched date'] && !m.watchedDate) m.watchedDate = row['watched date'];
        else if (row.date && !m.watchedDate) m.watchedDate = row.date;
    }

    // ratings.csv
    for (const row of files.ratings ?? []) {
        if (!row.name) continue;
        const m = upsert(row.name, row.year);
        const lb = parseFloat(row.rating);
        if (!isNaN(lb)) m.rating = Math.round(lb * 2); // 0.5–5 → 1–10
    }

    // reviews.csv
    for (const row of files.reviews ?? []) {
        if (!row.name) continue;
        const m = upsert(row.name, row.year);
        m.watched = true;
        if (row.review?.trim()) m.review = row.review.trim();
        const lb = parseFloat(row.rating);
        if (!isNaN(lb) && !m.rating) m.rating = Math.round(lb * 2);
        if (row['watched date'] && !m.watchedDate) m.watchedDate = row['watched date'];
    }

    // watchlist.csv
    for (const row of files.watchlist ?? []) {
        if (!row.name) continue;
        const m = upsert(row.name, row.year);
        m.watchlist = true;
    }

    return Array.from(map.values());
}

// ─── Drop zone ───────────────────────────────────────────────────────────────

function DropZone({
    label, hint, accept, onFile, loaded,
}: {
    label: string; hint: string; accept: string;
    onFile: (rows: Record<string, string>[]) => void;
    loaded: number;
}) {
    const [dragging, setDragging] = useState(false);

    const handle = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const rows = parseCSV(e.target?.result as string);
            onFile(rows);
        };
        reader.readAsText(file, 'utf-8');
    }, [onFile]);

    return (
        <label
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)',
                border: `2px dashed ${loaded ? 'var(--brand)' : dragging ? 'var(--brand)' : 'var(--border-default)'}`,
                background: loaded ? 'rgba(0,209,193,0.06)' : dragging ? 'rgba(0,209,193,0.04)' : 'var(--bg-secondary)',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
        >
            <input type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
            {loaded ? (
                <Check size={22} style={{ color: 'var(--brand)' }} />
            ) : (
                <Upload size={22} style={{ color: 'var(--text-tertiary)' }} />
            )}
            <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: loaded ? 'var(--brand)' : 'var(--text-primary)' }}>
                {loaded ? `${loaded} rows loaded` : label}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{hint}</p>
        </label>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'importing' | 'done';

export default function ImportPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const [step, setStep] = useState<Step>('upload');
    const [csvData, setCsvData] = useState<Record<string, Record<string, string>[]>>({});
    const [items, setItems] = useState<ImportItem[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [showAll, setShowAll] = useState(false);

    if (!session) {
        router.push('/login');
        return null;
    }

    const setFile = (key: string, rows: Record<string, string>[]) => {
        setCsvData((prev) => ({ ...prev, [key]: rows }));
    };

    const totalFiles = Object.keys(csvData).length;
    const preview = totalFiles > 0 ? mergeCSVs(csvData) : [];

    const watchedCount = preview.filter((m) => m.watched).length;
    const ratedCount = preview.filter((m) => m.rating).length;
    const reviewCount = preview.filter((m) => m.review).length;
    const watchlistCount = preview.filter((m) => m.watchlist).length;

    const startImport = async () => {
        const initial: ImportItem[] = preview.map((m) => ({ ...m, status: 'pending', actions: [] }));
        setItems(initial);
        setStep('importing');
        setCurrentIdx(0);

        let idx = 0;
        for (const movie of initial) {
            setCurrentIdx(idx);
            setItems((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], status: 'running' };
                return next;
            });

            try {
                const res = await fetch('/api/import/letterboxd', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: movie.title,
                        year: movie.year,
                        watched: movie.watched,
                        watchedDate: movie.watchedDate,
                        rating: movie.rating,
                        review: movie.review,
                        watchlist: movie.watchlist,
                    }),
                });
                const data = await res.json();
                setItems((prev) => {
                    const next = [...prev];
                    next[idx] = {
                        ...next[idx],
                        status: data.data?.status === 'imported' ? 'imported'
                            : data.data?.status === 'not_found' ? 'not_found' : 'error',
                        actions: data.data?.actions ?? [],
                    };
                    return next;
                });
            } catch {
                setItems((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], status: 'error', error: 'Network error', actions: [] };
                    return next;
                });
            }

            idx++;
            // Small delay to avoid hammering TMDB rate limit
            await new Promise((r) => setTimeout(r, 120));
        }

        setStep('done');
    };

    const importedCount = items.filter((i) => i.status === 'imported').length;
    const notFoundCount = items.filter((i) => i.status === 'not_found').length;
    const errorCount = items.filter((i) => i.status === 'error').length;
    const progress = items.length > 0 ? ((importedCount + notFoundCount + errorCount) / items.length) * 100 : 0;

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 700 }}>
                <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xl)', textDecoration: 'none' }}>
                    <ArrowLeft size={15} /> Back to Settings
                </Link>

                <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(0,209,193,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Upload size={22} style={{ color: 'var(--brand)' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>Import from Letterboxd</h1>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Bring your entire Letterboxd history into FrameVault
                            </p>
                        </div>
                    </div>
                </div>

                {/* How to export guide */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-sm)' }}>
                    <p style={{ fontWeight: 700, marginBottom: 6 }}>How to export from Letterboxd:</p>
                    <ol style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 2, margin: 0 }}>
                        <li>Go to <strong>letterboxd.com</strong> → Settings → Data</li>
                        <li>Click <strong>"Export your data"</strong> and download the ZIP</li>
                        <li>Unzip it and upload the CSV files below</li>
                    </ol>
                </div>

                {/* ── STEP: UPLOAD ── */}
                {step === 'upload' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                            <DropZone
                                label="watched.csv or diary.csv"
                                hint="Films you've seen (with dates)"
                                accept=".csv"
                                loaded={csvData.watched?.length ?? 0}
                                onFile={(rows) => setFile('watched', rows)}
                            />
                            <DropZone
                                label="ratings.csv"
                                hint="Your star ratings"
                                accept=".csv"
                                loaded={csvData.ratings?.length ?? 0}
                                onFile={(rows) => setFile('ratings', rows)}
                            />
                            <DropZone
                                label="reviews.csv"
                                hint="Your written reviews"
                                accept=".csv"
                                loaded={csvData.reviews?.length ?? 0}
                                onFile={(rows) => setFile('reviews', rows)}
                            />
                            <DropZone
                                label="watchlist.csv"
                                hint="Films on your watchlist"
                                accept=".csv"
                                loaded={csvData.watchlist?.length ?? 0}
                                onFile={(rows) => setFile('watchlist', rows)}
                            />
                        </div>

                        {totalFiles > 0 && (
                            <>
                                {/* Summary */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                                    {[
                                        { icon: <Eye size={16} />, label: 'Watched', value: watchedCount },
                                        { icon: <Star size={16} />, label: 'Ratings', value: ratedCount },
                                        { icon: <MessageSquare size={16} />, label: 'Reviews', value: reviewCount },
                                        { icon: <BookmarkPlus size={16} />, label: 'Watchlist', value: watchlistCount },
                                    ].map((s) => (
                                        <div key={s.label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', textAlign: 'center' }}>
                                            <div style={{ color: 'var(--brand)', display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.icon}</div>
                                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{s.value}</div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Movie preview list */}
                                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-xl)' }}>
                                    <div style={{ padding: '12px var(--space-md)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{preview.length} unique films found</span>
                                        <button onClick={() => setShowAll((p) => !p)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--brand)', fontWeight: 600 }}>
                                            {showAll ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Show all</>}
                                        </button>
                                    </div>
                                    <div style={{ maxHeight: showAll ? 480 : 220, overflowY: 'auto' }}>
                                        {preview.slice(0, showAll ? undefined : 8).map((m, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '8px var(--space-md)', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <Film size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                                <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600 }}>{m.title}</span>
                                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{m.year}</span>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    {m.watched && <span style={{ fontSize: 10, background: 'rgba(0,209,193,0.15)', color: 'var(--brand)', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>watched</span>}
                                                    {m.rating && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>{m.rating}/10</span>}
                                                    {m.review && <span style={{ fontSize: 10, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>review</span>}
                                                    {m.watchlist && <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>watchlist</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary"
                                    onClick={startImport}
                                    style={{ width: '100%', justifyContent: 'center', fontSize: 'var(--text-base)', padding: '14px' }}
                                >
                                    Import {preview.length} Films
                                </button>
                            </>
                        )}

                        {totalFiles === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-xl)' }}>
                                Upload at least one CSV file to continue
                            </p>
                        )}
                    </>
                )}

                {/* ── STEP: IMPORTING ── */}
                {(step === 'importing' || step === 'done') && (
                    <>
                        {/* Progress bar */}
                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 'var(--text-sm)' }}>
                                <span style={{ fontWeight: 700 }}>
                                    {step === 'done' ? 'Import complete' : `Importing ${currentIdx + 1} of ${items.length}…`}
                                </span>
                                <span style={{ color: 'var(--text-tertiary)' }}>{Math.round(progress)}%</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--brand)', borderRadius: 4, transition: 'width 0.3s ease' }} />
                            </div>
                        </div>

                        {/* Stats */}
                        {step === 'done' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                                {[
                                    { label: 'Imported', value: importedCount, color: 'var(--brand)' },
                                    { label: 'Not found', value: notFoundCount, color: '#f59e0b' },
                                    { label: 'Errors', value: errorCount, color: '#ef4444' },
                                ].map((s) => (
                                    <div key={s.label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', textAlign: 'center' }}>
                                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Live log */}
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                            <div style={{ padding: '10px var(--space-md)', borderBottom: '1px solid var(--border-default)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                                Log
                            </div>
                            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '4px 0' }}>
                                {items.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px var(--space-md)', opacity: item.status === 'pending' ? 0.3 : 1 }}>
                                        {item.status === 'pending' && <div style={{ width: 16, height: 16, flexShrink: 0 }} />}
                                        {item.status === 'running' && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)', flexShrink: 0 }} />}
                                        {item.status === 'imported' && <Check size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />}
                                        {item.status === 'not_found' && <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                                        {item.status === 'error' && <X size={16} style={{ color: '#ef4444', flexShrink: 0 }} />}
                                        <span style={{ fontSize: 'var(--text-sm)', flex: 1, fontWeight: 600 }}>{item.title}</span>
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{item.year}</span>
                                        {item.actions.length > 0 && (
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{item.actions.join(' · ')}</span>
                                        )}
                                        {item.status === 'not_found' && (
                                            <span style={{ fontSize: 'var(--text-xs)', color: '#f59e0b' }}>not on TMDB</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {step === 'done' && (
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)' }}>
                                <Link href={`/users/${session.user.username}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                    View My Profile
                                </Link>
                                <button onClick={() => { setStep('upload'); setCsvData({}); setItems([]); }} className="btn btn-ghost">
                                    Import more
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
