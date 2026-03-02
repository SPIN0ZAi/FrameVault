'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear field error on change
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Client-side validation
        const newErrors: Record<string, string> = {};

        if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers, and underscores';
        }
        if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    username: formData.username,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error?.code === 'EMAIL_TAKEN') {
                    setErrors({ email: data.error.message });
                } else if (data.error?.code === 'USERNAME_TAKEN') {
                    setErrors({ username: data.error.message });
                } else if (data.error?.code === 'VALIDATION_ERROR') {
                    setErrors({ general: data.error.message });
                } else {
                    setErrors({ general: 'Something went wrong. Please try again.' });
                }
                return;
            }

            // Auto sign-in after registration
            const signInResult = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (signInResult?.ok) {
                router.push('/');
                router.refresh();
            } else {
                router.push('/login');
            }
        } catch {
            setErrors({ general: 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join FrameVault — it&apos;s completely free</p>
                </div>

                {errors.general && (
                    <div style={{
                        padding: 'var(--space-md)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--error)',
                        fontSize: 'var(--text-sm)',
                        marginBottom: 'var(--space-md)',
                    }}>
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label htmlFor="email" className="input-label">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            className={`input ${errors.email ? 'input-error' : ''}`}
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                        />
                        {errors.email && <p className="error-message">{errors.email}</p>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="username" className="input-label">Username</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            className={`input ${errors.username ? 'input-error' : ''}`}
                            placeholder="movie_lover"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                        />
                        {errors.username && <p className="error-message">{errors.username}</p>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="input-label">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            className={`input ${errors.password ? 'input-error' : ''}`}
                            placeholder="Min 8 characters"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                        {errors.password && <p className="error-message">{errors.password}</p>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                        {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        id="register-submit"
                        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account?{' '}
                    <Link href="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
