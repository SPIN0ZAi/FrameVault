'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) setError('Missing or invalid reset token. Please request a new reset link.');
    }, [token]);

    const validate = (): string => {
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (password.length > 128) return 'Password must be at most 128 characters';
        if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
        if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
        if (!/[0-9]/.test(password)) return 'Password must contain a number';
        if (password !== confirm) return 'Passwords do not match';
        return '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data?.error?.message ?? 'Something went wrong. Please try again.');
                return;
            }

            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {success ? (
                    <>
                        <div className="auth-header">
                            <div style={{ fontSize: '48px', marginBottom: 'var(--space-sm)' }}>✅</div>
                            <h1 className="auth-title">Password Updated</h1>
                            <p className="auth-subtitle">
                                Your password has been reset successfully.
                                Redirecting you to sign in…
                            </p>
                        </div>
                        <div className="auth-footer" style={{ marginTop: 'var(--space-xl)' }}>
                            <Link href="/login">Go to Sign In</Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="auth-header">
                            <h1 className="auth-title">Set New Password</h1>
                            <p className="auth-subtitle">
                                Choose a strong password for your account.
                            </p>
                        </div>

                        {error && (
                            <div style={{
                                padding: 'var(--space-md)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--error)',
                                fontSize: 'var(--text-sm)',
                                marginBottom: 'var(--space-md)',
                            }}>
                                {error}{' '}
                                {(error.includes('expired') || error.includes('invalid') || error.includes('Missing')) && (
                                    <Link href="/forgot-password" style={{ color: 'inherit', textDecoration: 'underline' }}>
                                        Request a new link
                                    </Link>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="input-group">
                                <label htmlFor="password" className="input-label">New Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    disabled={!token}
                                />
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Min 8 chars · uppercase · lowercase · number
                                </p>
                            </div>

                            <div className="input-group">
                                <label htmlFor="confirm" className="input-label">Confirm Password</label>
                                <input
                                    id="confirm"
                                    type="password"
                                    className="input"
                                    placeholder="••••••••"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    disabled={!token}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={loading || !token}
                                style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <Link href="/login">Back to Sign In</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-header">
                        <p className="auth-subtitle">Loading…</p>
                    </div>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
