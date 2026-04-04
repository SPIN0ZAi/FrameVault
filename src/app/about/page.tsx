import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 860 }}>
                <section
                    style={{
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-xl)',
                        background: 'linear-gradient(145deg, rgba(0,209,193,0.08) 0%, rgba(139,92,246,0.08) 100%)',
                        padding: 'var(--space-2xl)',
                    }}
                >
                    <p style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', fontWeight: 700, marginBottom: 10 }}>
                        About FrameVault
                    </p>
                    <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 'var(--space-md)' }}>
                        Built from passion, crafted with engineering.
                    </h1>
                    <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.85, marginBottom: 'var(--space-md)' }}>
                        I&apos;m <strong style={{ color: 'var(--text-primary)' }}>Soulaimane Ben Louaret</strong>, a second-year engineering student.
                        FrameVault is my personal project where cinema passion meets technical creativity — a place to track, rate, review,
                        and share the stories that matter.
                    </p>
                    <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.85, marginBottom: 'var(--space-lg)' }}>
                        The mission is simple: make movie and TV tracking elegant, fast, and genuinely fun.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        <a
                            href="https://soulaimane-ben-louaret-portolio.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                        >
                            Visit My Portfolio
                        </a>
                        <a href="mailto:ssolayman244@gmail.com" className="btn btn-secondary">
                            Contact Me
                        </a>
                        <Link href="/" className="btn btn-ghost">
                            Back to Home
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
