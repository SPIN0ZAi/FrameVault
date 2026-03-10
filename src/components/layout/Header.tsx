'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, User, ClipboardList, Settings, LogOut, BookOpen, Activity, Tv, Film, List, Users, Clapperboard, BookMarked, LayoutDashboard, Trophy, Sparkles } from 'lucide-react';

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const dest = pathname.startsWith('/shows') ? '/shows' : '/movies';
            router.push(`${dest}?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    return (
        <header className="header">
            <div className="header-inner">
                {/* Logo */}
                <Link href="/" className="header-logo" style={{ gap: '10px' }}>
                    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 30L45 15V85L10 70V30Z" fill="#00D1C1" />
                        <path d="M90 30L55 15V85L90 70V30Z" fill="#00D1C1" />
                        <path d="M30 40H70V60H30V40Z" fill="#1A1D21" />
                    </svg>
                    <span style={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>FrameVault</span>
                </Link>

                {/* Navigation */}
                <nav className="header-nav">
                    <Link href="/movies" className="header-nav-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Film size={14} /> Films
                    </Link>
                    <Link href="/shows" className="header-nav-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Tv size={14} /> Shows
                    </Link>
                    <Link href="/lists" className="header-nav-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <List size={14} /> Lists
                    </Link>
                    <Link href="/members" className="header-nav-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users size={14} /> Members
                    </Link>
                    <Link href="/leaderboard" className="header-nav-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Trophy size={14} /> Leaderboard
                    </Link>
                    <Link href="/mood" className="header-nav-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Sparkles size={14} /> Mood
                    </Link>
                    {session && (
                        <>
                            <Link href="/activity" className="header-nav-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Activity size={14} /> Activity
                            </Link>
                            <Link href="/diary" className="header-nav-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <BookMarked size={14} /> Diary
                            </Link>
                            <Link href={`/users/${session.user.username}`} className="header-nav-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <LayoutDashboard size={14} /> Profile
                            </Link>
                        </>
                    )}
                </nav>

                {/* Actions */}
                <div className="header-actions">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="header-search">
                        <span className="header-search-icon">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            className="header-search-input"
                            placeholder={pathname.startsWith('/shows') ? 'Search TV shows…' : 'Search films…'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search movies"
                            id="header-search"
                        />
                    </form>

                    {session ? (
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                className="header-avatar"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                aria-label="User menu"
                                id="user-menu-button"
                            >
                                {session.user.image ? (
                                    <img src={session.user.image} alt={session.user.username} />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        color: 'var(--text-secondary)',
                                        background: 'var(--bg-tertiary)',
                                    }}>
                                        {session.user.username?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </button>

                            {dropdownOpen && (
                                <div className="user-dropdown">
                                    <div style={{
                                        padding: 'var(--space-sm) var(--space-md)',
                                        borderBottom: '1px solid var(--border-subtle)',
                                        marginBottom: 'var(--space-xs)',
                                    }}>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                                            {session.user.username}
                                        </div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                            {session.user.email}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/users/${session.user.username}`}
                                        className="user-dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <User size={16} /> My Profile
                                    </Link>
                                    <Link
                                        href="/diary"
                                        className="user-dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <BookOpen size={16} /> Diary
                                    </Link>
                                    <Link
                                        href="/activity"
                                        className="user-dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <Activity size={16} /> Activity
                                    </Link>
                                    <Link
                                        href={`/users/${session.user.username}`}
                                        className="user-dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <ClipboardList size={16} /> Watchlist
                                    </Link>
                                    <Link
                                        href="/settings"
                                        className="user-dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <Settings size={16} /> Settings
                                    </Link>
                                    <div className="divider" style={{ margin: 'var(--space-xs) 0' }} />
                                    <button
                                        className="user-dropdown-item"
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            signOut({ callbackUrl: window.location.origin + '/' });
                                        }}
                                        id="logout-button"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="btn btn-ghost btn-sm">
                                Sign In
                            </Link>
                            <Link href="/register" className="btn btn-primary btn-sm">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
