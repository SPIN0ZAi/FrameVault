import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <p className="footer-text">
                    © {new Date().getFullYear()} FrameVault — Every frame tells a story.
                </p>
                <div className="footer-links">
                    <Link href="/movies" className="footer-link">Browse</Link>
                    <Link href="/about" className="footer-link">About</Link>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-link"
                    >
                        GitHub
                    </a>
                </div>
            </div>
        </footer>
    );
}
