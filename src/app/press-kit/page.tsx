export default function PressKitPage() {
    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 820 }}>
                <h1 className="page-title" style={{ marginBottom: 'var(--space-md)' }}>Press Kit</h1>
                <div className="card" style={{ display: 'grid', gap: 'var(--space-md)' }}>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        FrameVault is an independent movie and TV tracking platform focused on elegant UX and social discovery.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        Founder: Soulaimane Ben Louaret
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        Portfolio: <a href="https://soulaimane-ben-louaret-portolio.vercel.app/" target="_blank" rel="noopener noreferrer">soulaimane-ben-louaret-portolio.vercel.app</a>
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        Contact: <a href="mailto:ssolayman244@gmail.com">ssolayman244@gmail.com</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
