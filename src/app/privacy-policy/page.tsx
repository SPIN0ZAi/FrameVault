export default function PrivacyPolicyPage() {
    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 820 }}>
                <h1 className="page-title" style={{ marginBottom: 'var(--space-md)' }}>Privacy Policy</h1>
                <div className="card" style={{ display: 'grid', gap: 'var(--space-md)' }}>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        FrameVault stores account information and activity data (watch history, ratings, reviews, and lists)
                        to provide core app features.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        We do not sell personal data. You can request account deletion from settings once the deletion flow is enabled.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        Contact: <a href="mailto:ssolayman244@gmail.com">ssolayman244@gmail.com</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
