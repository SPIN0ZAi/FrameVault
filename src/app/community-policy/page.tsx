export default function CommunityPolicyPage() {
    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 820 }}>
                <h1 className="page-title" style={{ marginBottom: 'var(--space-md)' }}>Community Policy</h1>
                <div className="card" style={{ display: 'grid', gap: 'var(--space-md)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        FrameVault is built for respectful discussion around films and TV shows.
                    </p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                        <li>Be respectful and constructive in reviews and comments.</li>
                        <li>No hate speech, harassment, threats, or abusive behavior.</li>
                        <li>No spam, fake engagement, or misleading content.</li>
                        <li>Use spoiler labels where appropriate.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
