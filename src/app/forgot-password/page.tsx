'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.error?.message ?? 'Something went wrong. Please try again.');
                return;
            }

            setSubmitted(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {submitted ? (
                    <>
                        <div className="auth-header">
                            <div style={{ fontSize: '48px', marginBottom: 'var(--space-sm)' }}>📬</div>
                            <h1 className="auth-title">Check your inbox</h1>
                            <p className="auth-subtitle">
                                If an account with that email exists, we&apos;ve sent a password reset link.
                                The link expires in 1 hour.
                            </p>
                        </div>
                        <div className="auth-footer" style={{ marginTop: 'var(--space-xl)' }}>
                            <Link href="/login">Back to Sign In</Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="auth-header">
                            <h1 className="auth-title">Forgot Password?</h1>
                            <p className="auth-subtitle">
                                Enter your email address and we&apos;ll send you a link to reset your password.
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
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="input-group">
                                <label htmlFor="email" className="input-label">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={loading}
                                style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            Remembered it?{' '}
                            <Link href="/login">Back to Sign In</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
