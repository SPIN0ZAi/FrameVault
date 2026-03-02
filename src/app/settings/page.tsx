'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Loader2, User as UserIcon, Palette, Lock, Trash2,
    Camera, MapPin, FileText, Check, AlertTriangle, Eye, EyeOff, Upload, Download,
} from 'lucide-react';

type Tab = 'profile' | 'appearance' | 'account' | 'danger';

const THEME_PRESETS = [
    { label: 'Teal',    color: '#00D1C1' },
    { label: 'Violet',  color: '#8B5CF6' },
    { label: 'Rose',    color: '#F43F5E' },
    { label: 'Amber',   color: '#F59E0B' },
    { label: 'Sky',     color: '#0EA5E9' },
    { label: 'Emerald', color: '#10B981' },
    { label: 'Fuchsia', color: '#D946EF' },
    { label: 'Orange',  color: '#F97316' },
    { label: 'Lime',    color: '#84CC16' },
    { label: 'Crimson', color: '#DC2626' },
];

function PasswordStrength({ password }: { password: string }) {
    if (!password) return null;
    const len = password.length;
    const strength = len < 8 ? 1 : len < 12 ? 2 : len < 16 ? 3 : 4;
    const labels = ['', 'Too short', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ef4444', '#f59e0b', '#10b981', '#00D1C1'];
    return (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    style={{
                        height: 3, flex: 1, borderRadius: 2,
                        background: i <= strength ? colors[strength] : 'var(--border-default)',
                        transition: 'background 0.2s',
                    }}
                />
            ))}
            <span style={{ fontSize: 11, color: colors[strength], fontWeight: 600, minWidth: 60 }}>
                {labels[strength]}
            </span>
        </div>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [isLoading, setIsLoading] = useState(true);

    // Profile
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Appearance
    const [themeColor, setThemeColor] = useState('#00D1C1');

    // Password
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [isSavingPw, setIsSavingPw] = useState(false);
    const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Export
    const [isExporting, setIsExporting] = useState(false);
    const [exportMsg, setExportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Danger zone
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/users/me');
                if (res.status === 401) { router.push('/login'); return; }
                const data = await res.json();
                if (data.success && data.data) {
                    const u = data.data;
                    setBio(u.profile?.bio || '');
                    setLocation(u.profile?.location || '');
                    setAvatarUrl(u.avatarUrl || null);
                    setBannerUrl(u.profile?.bannerUrl || null);
                    setThemeColor(u.profile?.themeColor || '#00D1C1');
                }
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [router]);

    const uploadToSupabase = async (file: File, type: 'avatar' | 'banner') => {
        const ext = file.name.split('.').pop() || 'jpg';
        const res = await fetch('/api/uploads/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, contentType: file.type, extension: ext }),
        });
        const d = await res.json();
        if (!d.success) throw new Error(d.error?.message || 'Failed to get upload URL');
        const uploadRes = await fetch(d.data.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
        });
        if (!uploadRes.ok) throw new Error('Upload failed');
        return d.data.publicUrl as string;
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSaveMsg(null);
        try {
            let finalAvatar = avatarUrl;
            let finalBanner = bannerUrl;
            if (avatarFile) { finalAvatar = await uploadToSupabase(avatarFile, 'avatar'); setAvatarUrl(finalAvatar); setAvatarFile(null); }
            if (bannerFile) { finalBanner = await uploadToSupabase(bannerFile, 'banner'); setBannerUrl(finalBanner); setBannerFile(null); }
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio, location, themeColor, avatarUrl: finalAvatar, bannerUrl: finalBanner }),
            });
            const data = await res.json();
            if (data.success) {
                setSaveMsg({ type: 'success', text: 'Saved successfully!' });
                router.refresh();
            } else {
                throw new Error(data.error?.message || 'Failed to save');
            }
        } catch (e: unknown) {
            setSaveMsg({ type: 'error', text: (e as Error).message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
        if (newPw.length < 8) { setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return; }
        setIsSavingPw(true);
        setPwMsg(null);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
            });
            const data = await res.json();
            if (data.success) {
                setPwMsg({ type: 'success', text: 'Password updated successfully.' });
                setCurrentPw(''); setNewPw(''); setConfirmPw('');
            } else {
                throw new Error(data.error?.message || 'Failed to change password');
            }
        } catch (e: unknown) {
            setPwMsg({ type: 'error', text: (e as Error).message });
        } finally {
            setIsSavingPw(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        setExportMsg(null);
        try {
            const res = await fetch('/api/users/me/export');
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().slice(0, 10);
            const a = document.createElement('a');
            a.href = url;
            a.download = `framevault-${username}-${date}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setExportMsg({ type: 'success', text: 'Export downloaded — upload letterboxd-import.csv at letterboxd.com/import/' });
        } catch {
            setExportMsg({ type: 'error', text: 'Export failed. Please try again.' });
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
            </div>
        );
    }

    const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
        { id: 'profile',    icon: <UserIcon size={16} />, label: 'Profile' },
        { id: 'appearance', icon: <Palette size={16} />,  label: 'Appearance' },
        { id: 'account',    icon: <Lock size={16} />,     label: 'Account' },
        { id: 'danger',     icon: <Trash2 size={16} />,   label: 'Danger Zone' },
    ];

    const username = session?.user?.username ?? '';
    const email = (session?.user as { email?: string })?.email ?? '';

    const card: React.CSSProperties = {
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
    };
    const cardHead: React.CSSProperties = {
        padding: 'var(--space-lg)',
        borderBottom: '1px solid var(--border-default)',
    };
    const cardBody: React.CSSProperties = {
        padding: 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        display: 'block',
        marginBottom: 'var(--space-sm)',
    };
    const saveBar: React.CSSProperties = {
        ...card,
        padding: 'var(--space-md) var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '1060px' }}>

                <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Settings</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
                        Manage your profile, appearance, and account
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>

                    {/* ── Sidebar ── */}
                    <aside style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-default)',
                        padding: 'var(--space-sm)',
                        position: 'sticky',
                        top: '100px',
                    }}>
                        {tabs.map((tab) => {
                            const isDanger = tab.id === 'danger';
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setSaveMsg(null); setPwMsg(null); }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                        padding: '10px var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: 600,
                                        marginBottom: 2,
                                        background: isActive
                                            ? (isDanger ? 'rgba(239,68,68,0.12)' : 'rgba(0,209,193,0.1)')
                                            : 'transparent',
                                        color: isDanger ? '#ef4444' : (isActive ? 'var(--brand)' : 'var(--text-secondary)'),
                                        transition: 'all 0.15s',
                                        textAlign: 'left',
                                    }}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            );
                        })}

                        <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-primary)', flexShrink: 0, border: '2px solid var(--brand)' }}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>
                                        {username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{username}</p>
                                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</p>
                            </div>
                        </div>
                    </aside>

                    {/* ── Main content ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', minWidth: 0 }}>

                        {/* ════ PROFILE TAB ════ */}
                        {activeTab === 'profile' && (
                            <>
                                <div style={card}>
                                    <div style={cardHead}>
                                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Photos</h2>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Profile picture and banner displayed on your public page</p>
                                    </div>
                                    <div style={{ padding: 'var(--space-lg)' }}>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{
                                                borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '21/5',
                                                background: 'var(--bg-primary)', border: '1px solid var(--border-default)', position: 'relative',
                                            }}>
                                                {bannerUrl && <img src={bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                <div
                                                    style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bannerUrl ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.08)', opacity: bannerUrl ? 0 : 1, transition: 'opacity 0.2s' }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.opacity = bannerUrl ? '0' : '1')}
                                                >
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-full)', padding: '8px 18px', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                                                        <Camera size={15} />
                                                        {bannerUrl ? 'Change Banner' : 'Upload Banner'}
                                                        <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => {
                                                            const f = e.target.files?.[0];
                                                            if (!f) return;
                                                            setBannerFile(f);
                                                            setBannerUrl(URL.createObjectURL(f));
                                                        }} />
                                                    </label>
                                                </div>
                                            </div>

                                            <div style={{ position: 'absolute', bottom: -36, left: 'var(--space-lg)', width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--bg-secondary)', background: 'var(--bg-primary)', zIndex: 2 }}>
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: 'var(--brand)' }}>
                                                        {username.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: 52, display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-full)', padding: '8px 18px', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                                                <Camera size={15} />
                                                Change Avatar
                                                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (!f) return;
                                                    setAvatarFile(f);
                                                    setAvatarUrl(URL.createObjectURL(f));
                                                }} />
                                            </label>
                                            {(avatarFile || bannerFile) && (
                                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)' }} />
                                                    {[avatarFile && 'avatar', bannerFile && 'banner'].filter(Boolean).join(' & ')} staged — save to upload
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={card}>
                                    <div style={cardHead}>
                                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>About You</h2>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Shown on your public profile</p>
                                    </div>
                                    <div style={cardBody}>
                                        <div>
                                            <label style={labelStyle}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} /> Location</span>
                                            </label>
                                            <input className="input" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Los Angeles, CA" style={{ width: '100%', maxWidth: 400 }} />
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} /> Bio</span>
                                                <span style={{ fontWeight: 400, color: bio.length > 270 ? 'var(--warning)' : 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{bio.length} / 300</span>
                                            </label>
                                            <textarea className="input" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 300))} placeholder="Tell the community about your taste in films..." style={{ width: '100%', minHeight: 110, resize: 'vertical' }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={saveBar}>
                                    {saveMsg ? (
                                        <span style={{ fontSize: 'var(--text-sm)', color: saveMsg.type === 'success' ? 'var(--success)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {saveMsg.type === 'success' && <Check size={14} />}
                                            {saveMsg.text}
                                        </span>
                                    ) : <span />}
                                    <button className="btn btn-primary" onClick={handleSaveProfile} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {isSaving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                                        {isSaving ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ════ APPEARANCE TAB ════ */}
                        {activeTab === 'appearance' && (
                            <>
                                <div style={card}>
                                    <div style={cardHead}>
                                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Profile Theme Color</h2>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Accent color shown on your public profile page</p>
                                    </div>
                                    <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                                        <div>
                                            <p style={{ ...labelStyle, marginBottom: 'var(--space-md)' }}>Presets</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                {THEME_PRESETS.map((p) => (
                                                    <button
                                                        key={p.color}
                                                        title={p.label}
                                                        onClick={() => setThemeColor(p.color)}
                                                        style={{
                                                            width: 44, height: 44, borderRadius: 'var(--radius-md)', background: p.color,
                                                            border: themeColor === p.color ? '3px solid white' : '2px solid transparent',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            outline: themeColor === p.color ? `3px solid ${p.color}` : 'none',
                                                            outlineOffset: 2, transition: 'all 0.15s', flexShrink: 0,
                                                        }}
                                                    >
                                                        {themeColor === p.color && <Check size={18} color="#000" strokeWidth={3} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                            <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', background: 'transparent', padding: 0, flexShrink: 0 }} />
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Custom color</p>
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{themeColor.toUpperCase()}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p style={{ ...labelStyle, marginBottom: 'var(--space-sm)' }}>Preview</p>
                                            <div style={{ padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-secondary)', border: `3px solid ${themeColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: themeColor }}>
                                                        {username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: themeColor }}>@{username}</p>
                                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Film lover</p>
                                                    </div>
                                                </div>
                                                <button style={{ background: themeColor, color: '#000', fontWeight: 700, fontSize: 'var(--text-sm)', border: 'none', borderRadius: 'var(--radius-full)', padding: '7px 18px', cursor: 'default', pointerEvents: 'none' }}>Follow</button>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {[1, 2, 3, 4, 5].map((i) => (
                                                        <div key={i} style={{ width: 14, height: 14, borderRadius: 2, background: i <= 3 ? themeColor : 'var(--border-default)' }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={saveBar}>
                                    {saveMsg ? (
                                        <span style={{ fontSize: 'var(--text-sm)', color: saveMsg.type === 'success' ? 'var(--success)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {saveMsg.type === 'success' && <Check size={14} />}
                                            {saveMsg.text}
                                        </span>
                                    ) : <span />}
                                    <button className="btn btn-primary" onClick={handleSaveProfile} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {isSaving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                                        {isSaving ? 'Saving…' : 'Save Appearance'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ════ ACCOUNT TAB ════ */}
                        {activeTab === 'account' && (
                            <>
                                <div style={card}>
                                    <div style={cardHead}>
                                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Account Details</h2>
                                    </div>
                                    <div style={cardBody}>
                                        <div>
                                            <label style={labelStyle}>Username</label>
                                            <div className="input" style={{ opacity: 0.55, cursor: 'not-allowed', maxWidth: 360 }}>@{username}</div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Email</label>
                                            <div className="input" style={{ opacity: 0.55, cursor: 'not-allowed', maxWidth: 360 }}>{email}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={card}>
                                    <div style={cardHead}>
                                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Change Password</h2>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Use a strong password with at least 8 characters</p>
                                    </div>
                                    <div style={cardBody}>
                                        <div>
                                            <label style={labelStyle}>Current Password</label>
                                            <div style={{ position: 'relative', maxWidth: 400 }}>
                                                <input className="input" type={showCurrentPw ? 'text' : 'password'} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" style={{ width: '100%', paddingRight: 44 }} />
                                                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>
                                                    {showCurrentPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={labelStyle}>New Password</label>
                                            <div style={{ position: 'relative', maxWidth: 400 }}>
                                                <input className="input" type={showNewPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" style={{ width: '100%', paddingRight: 44 }} />
                                                <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>
                                                    {showNewPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                                </button>
                                            </div>
                                            <div style={{ maxWidth: 400 }}>
                                                <PasswordStrength password={newPw} />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Confirm New Password</label>
                                            <input className="input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" style={{ maxWidth: 400, width: '100%', borderColor: confirmPw && confirmPw !== newPw ? 'var(--error)' : undefined }} />
                                            {confirmPw && confirmPw !== newPw && (
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--error)', marginTop: 4 }}>Passwords do not match</p>
                                            )}
                                        </div>

                                        {pwMsg && (
                                            <div style={{ padding: '10px var(--space-md)', borderRadius: 'var(--radius-md)', maxWidth: 400, background: pwMsg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${pwMsg.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, fontSize: 'var(--text-sm)', color: pwMsg.type === 'success' ? '#10b981' : 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {pwMsg.type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}
                                                {pwMsg.text}
                                            </div>
                                        )}

                                        <button className="btn btn-primary" onClick={handleChangePassword} disabled={isSavingPw || !currentPw || !newPw || !confirmPw} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {isSavingPw && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                                            {isSavingPw ? 'Updating…' : 'Update Password'}
                                        </button>
                                    </div>
                                </div>

                                <div style={card}>
                                    <div style={cardHead}>
                                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Import Data</h2>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Bring your watch history, ratings, and reviews from other services</p>
                                    </div>
                                    <div style={cardBody}>
                                        <Link href="/import" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}>
                                            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(0,209,193,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Upload size={18} style={{ color: 'var(--brand)' }} />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>Import from Letterboxd</p>
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Upload your CSV export to sync watched films, ratings &amp; reviews</p>
                                            </div>
                                        </Link>
                                    </div>
                                </div>

                                <div style={card}>
                                    <div style={cardHead}>
                                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Export Data</h2>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Download your full watch history, ratings, and reviews in Letterboxd-compatible format</p>
                                    </div>
                                    <div style={cardBody}>
                                        {/* What's included */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
                                            {[
                                                { file: 'letterboxd-import.csv', desc: 'Upload directly to Letterboxd', highlight: true },
                                                { file: 'diary.csv',             desc: 'Watch history + ratings' },
                                                { file: 'ratings.csv',           desc: 'All your film ratings' },
                                                { file: 'reviews.csv',           desc: 'All your written reviews' },
                                                { file: 'watched.csv',           desc: 'Complete watched list' },
                                                { file: 'watchlist.csv',         desc: 'Your saved watchlist' },
                                            ].map(({ file, desc, highlight }) => (
                                                <div key={file} style={{ padding: '10px var(--space-md)', background: highlight ? 'rgba(0,209,193,0.06)' : 'var(--bg-primary)', border: `1px solid ${highlight ? 'rgba(0,209,193,0.25)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: highlight ? 'var(--brand)' : 'var(--text-tertiary)', marginTop: 5, flexShrink: 0 }} />
                                                    <div>
                                                        <p style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: highlight ? 'var(--brand)' : 'var(--text-primary)' }}>{file}</p>
                                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>{desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Letterboxd import instructions */}
                                        <div style={{ padding: 'var(--space-md)', background: 'rgba(0,209,193,0.04)', border: '1px solid rgba(0,209,193,0.15)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(0,209,193,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: 18 }}>🎞</span>
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 4 }}>Importing into Letterboxd</p>
                                                <ol style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', paddingLeft: 16, lineHeight: 1.8, margin: 0 }}>
                                                    <li>Download your export below</li>
                                                    <li>Go to <a href="https://letterboxd.com/import/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>letterboxd.com/import/</a></li>
                                                    <li>Upload <code style={{ background: 'rgba(0,209,193,0.12)', padding: '1px 5px', borderRadius: 3, fontFamily: 'var(--font-mono)' }}>letterboxd-import.csv</code></li>
                                                </ol>
                                            </div>
                                        </div>

                                        {exportMsg && (
                                            <div style={{ padding: '10px var(--space-md)', borderRadius: 'var(--radius-md)', background: exportMsg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${exportMsg.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, fontSize: 'var(--text-sm)', color: exportMsg.type === 'success' ? '#10b981' : 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {exportMsg.type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}
                                                {exportMsg.text}
                                            </div>
                                        )}

                                        <button
                                            className="btn btn-primary"
                                            onClick={handleExport}
                                            disabled={isExporting}
                                            style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
                                        >
                                            {isExporting
                                                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Preparing export…</>
                                                : <><Download size={15} /> Download Export (.zip)</>}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ════ DANGER ZONE TAB ════ */}
                        {activeTab === 'danger' && (
                            <div style={{ background: 'rgba(239,68,68,0.04)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239,68,68,0.2)', overflow: 'hidden' }}>
                                <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <AlertTriangle size={20} color="#ef4444" />
                                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: '#ef4444' }}>Danger Zone</h2>
                                </div>
                                <div style={{ padding: 'var(--space-lg)' }}>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', lineHeight: 1.75, maxWidth: 520 }}>
                                        Once you delete your account, there is <strong style={{ color: 'var(--text-primary)' }}>no going back</strong>. All reviews, ratings, watchlist entries, follows, and profile data will be permanently erased.
                                    </p>

                                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                                        Type your username{' '}
                                        <code style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
                                            {username}
                                        </code>{' '}
                                        to confirm
                                    </label>
                                    <input className="input" type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={username} style={{ width: '100%', maxWidth: 360, marginBottom: 'var(--space-lg)', borderColor: 'rgba(239,68,68,0.35)' }} />

                                    <button
                                        onClick={async () => {
                                            if (deleteConfirm !== username) return;
                                            setIsDeleting(true);
                                            // TODO: implement DELETE /api/users/me
                                            alert('Account deletion not yet implemented.');
                                            setIsDeleting(false);
                                        }}
                                        disabled={deleteConfirm !== username || isDeleting}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 8,
                                            background: deleteConfirm === username ? '#ef4444' : 'rgba(239,68,68,0.1)',
                                            color: deleteConfirm === username ? 'white' : 'rgba(239,68,68,0.4)',
                                            border: '1px solid rgba(239,68,68,0.3)',
                                            borderRadius: 'var(--radius-full)',
                                            padding: '10px 22px',
                                            fontWeight: 700, fontSize: 'var(--text-sm)',
                                            cursor: deleteConfirm === username ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {isDeleting
                                            ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</>
                                            : <><Trash2 size={15} /> Delete My Account</>
                                        }
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
