'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Film, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import MovieHoverCard from '@/components/ui/MovieHoverCard';

interface ActorMovie {
    id: number;
    title: string;
    character: string;
    year: number | null;
    posterUrl: string | null;
    averageRating: number | null;
}

interface Actor {
    id: number;
    name: string;
    biography: string;
    birthday: string | null;
    deathday: string | null;
    placeOfBirth: string | null;
    photoUrl: string | null;
    department: string;
    movies: ActorMovie[];
    directedWorks?: DirectedWork[];
}

interface DirectedWork {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    year: number | null;
    posterUrl: string | null;
    job: string | null;
}

function formatDate(str: string | null) {
    if (!str) return null;
    return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function calcAge(birthday: string | null, deathday: string | null) {
    if (!birthday) return null;
    const end = deathday ? new Date(deathday) : new Date();
    const born = new Date(birthday);
    let age = end.getFullYear() - born.getFullYear();
    const m = end.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < born.getDate())) age--;
    return age;
}

export default function ActorPage() {
    const { id } = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const [actor, setActor] = useState<Actor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showFullBio, setShowFullBio] = useState(false);
    const view = searchParams.get('view') === 'directed' ? 'directed' : 'acting';

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetch(`/api/actors/${id}?view=${view}`)
            .then(r => r.json())
            .then(d => {
                if (d.success) setActor(d.data);
                else setError(true);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id, view]);

    if (loading) return (
        <div className="page">
            <div className="container">
                <div style={{ display: 'flex', gap: 'var(--space-2xl)', marginTop: 'var(--space-2xl)' }}>
                    <div className="skeleton" style={{ width: 180, height: 270, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div className="skeleton" style={{ height: 36, width: '40%', borderRadius: 'var(--radius-md)' }} />
                        <div className="skeleton" style={{ height: 18, width: '25%', borderRadius: 'var(--radius-md)' }} />
                        <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />
                    </div>
                </div>
            </div>
        </div>
    );

    if (error || !actor) return (
        <div className="page">
            <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
                <Film size={48} style={{ margin: '0 auto var(--space-md)', opacity: 0.4 }} />
                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>Actor not found</h2>
                <Link href="/movies" className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-md)', display: 'inline-flex' }}>
                    <ArrowLeft size={14} /> Back to Browse
                </Link>
            </div>
        </div>
    );

    const age = calcAge(actor.birthday, actor.deathday);
    const BIO_LIMIT = 500;
    const bioTrimmed = actor.biography && actor.biography.length > BIO_LIMIT && !showFullBio
        ? actor.biography.slice(0, BIO_LIMIT) + '…'
        : actor.biography;

    return (
        <div className="page">
            <div className="container">
                {/* Back link */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <button onClick={() => window.history.back()} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={14} /> Back
                    </button>
                </div>

                {/* ── Actor header ── */}
                <div style={{ display: 'flex', gap: 'var(--space-2xl)', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 'var(--space-3xl)' }}>
                    {/* Photo */}
                    <div style={{ flexShrink: 0 }}>
                        <div style={{ width: 180, height: 270, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-secondary)', border: '2px solid var(--border-default)' }}>
                            {actor.photoUrl ? (
                                <img src={actor.photoUrl} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 800, color: 'var(--text-tertiary)' }}>
                                    {actor.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 240 }}>
                        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, marginBottom: 'var(--space-sm)', lineHeight: 1.1 }}>
                            {actor.name}
                        </h1>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 'var(--space-md)' }}>
                            {actor.department}
                        </p>

                        {/* Meta pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                            {actor.birthday && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}>
                                    <Calendar size={13} />
                                    <span>
                                        Born {formatDate(actor.birthday)}
                                        {age !== null && !actor.deathday && <> · <strong style={{ color: 'var(--text-primary)' }}>Age {age}</strong></>}
                                    </span>
                                </div>
                            )}
                            {actor.deathday && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}>
                                    <Calendar size={13} />
                                    <span>Died {formatDate(actor.deathday)}{age !== null && <> · Age {age}</>}</span>
                                </div>
                            )}
                            {actor.placeOfBirth && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}>
                                    <MapPin size={13} />
                                    <span>{actor.placeOfBirth}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}>
                                <Film size={13} />
                                <span>
                                    <strong style={{ color: 'var(--text-primary)' }}>{view === 'directed' ? (actor.directedWorks?.length ?? 0) : actor.movies.length}</strong>{' '}
                                    {view === 'directed' ? 'directed works' : 'films'}
                                </span>
                            </div>
                        </div>

                        {/* Biography */}
                        {actor.biography ? (
                            <div>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                                    {bioTrimmed}
                                </p>
                                {actor.biography.length > BIO_LIMIT && (
                                    <button onClick={() => setShowFullBio(v => !v)}
                                        style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--brand)', background: 'none', cursor: 'pointer', fontWeight: 700 }}>
                                        {showFullBio ? 'Show less' : 'Read more'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No biography available.</p>
                        )}
                    </div>
                </div>

                {/* ── Filmography ── */}
                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
                    {view === 'directed' ? 'Directed Movies & Series' : 'Filmography'}{' '}
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                        ({view === 'directed' ? (actor.directedWorks?.length ?? 0) : actor.movies.length})
                    </span>
                </h2>

                {view === 'directed' ? (
                    <div className="grid grid-movies">
                        {(actor.directedWorks ?? []).map(work => (
                            <Link key={`${work.mediaType}-${work.id}`} href={work.mediaType === 'movie' ? `/movies/${work.id}` : `/shows/${work.id}`} className="movie-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                {work.posterUrl ? (
                                    <img src={work.posterUrl} alt={work.title} loading="lazy" />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                                        {work.mediaType === 'movie' ? '🎬' : '📺'}
                                    </div>
                                )}
                                <div className="movie-card-overlay">
                                    <div className="movie-card-title">{work.title}</div>
                                    <div className="movie-card-year">
                                        {work.year ?? '—'} · {work.mediaType === 'movie' ? 'Movie' : 'Series'}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-movies">
                        {actor.movies.map(movie => (
                            <MovieHoverCard
                                key={movie.id}
                                id={movie.id.toString()}
                                href={`/movies/${movie.id}`}
                                title={movie.title}
                                year={movie.year ?? 0}
                                posterUrl={movie.posterUrl}
                                averageRating={movie.averageRating}
                                badge={movie.character ? (
                                    <div style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 10, color: 'rgba(255,255,255,0.75)', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                                        as {movie.character}
                                    </div>
                                ) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
