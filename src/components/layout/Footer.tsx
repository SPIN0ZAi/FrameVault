import Link from 'next/link';

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-links">
                    <Link href="/" className="footer-link">Home</Link>
                    <Link href="/about" className="footer-link">About</Link>
                    <Link href="/community-policy" className="footer-link">Community policy</Link>
                    <Link href="/privacy-policy" className="footer-link">Privacy policy</Link>
                    <Link href="/press-kit" className="footer-link">Press Kit</Link>
                    <a href="mailto:ssolayman244@gmail.com" className="footer-link">Contact me</a>
                </div>

                <div className="footer-meta">
                    <p className="footer-text">© {year} FrameVault. All rights reserved.</p>
                    <p className="footer-subtext">Every frame tells a story.</p>
                </div>

                <div className="footer-attribution">
                    <a
                        href="https://soulaimane-ben-louaret-portolio.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-link"
                    >
                        Portfolio
                    </a>
                    <span className="footer-dot" aria-hidden="true">•</span>
                    <a
                        href="https://github.com/SPIN0ZAi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-link"
                    >
                        GitHub
                    </a>
                    <span className="footer-dot" aria-hidden="true">•</span>
                    <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="footer-link footer-tmdb-link">
                        TV data from <span className="footer-tmdb-badge">TMDB</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
