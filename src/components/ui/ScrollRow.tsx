'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollRowProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export default function ScrollRow({ children, style }: ScrollRowProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const update = () => {
            const max = el.scrollWidth - el.clientWidth;
            setCanLeft(el.scrollLeft > 2);
            setCanRight(max - el.scrollLeft > 2);
        };

        update();
        el.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        return () => {
            el.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [children]);

    const scrollByPage = (direction: 'left' | 'right') => {
        const el = ref.current;
        if (!el) return;
        const amount = Math.max(240, Math.round(el.clientWidth * 0.8));
        el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    return (
        <div style={{ position: 'relative' }}>
            {canLeft && (
                <button
                    onClick={() => scrollByPage('left')}
                    aria-label="Scroll left"
                    style={{
                        position: 'absolute',
                        left: 4,
                        top: '40%',
                        transform: 'translateY(-50%)',
                        zIndex: 20,
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: '1px solid var(--border-default)',
                        background: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <ChevronLeft size={18} />
                </button>
            )}

            <div
                ref={ref}
                style={{
                    display: 'flex',
                    gap: 'var(--space-md)',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                    margin: '0 calc(var(--space-lg) * -1)',
                    padding: '0 var(--space-lg) var(--space-lg)',
                    ...style,
                }}
            >
                {children}
            </div>

            {canRight && (
                <button
                    onClick={() => scrollByPage('right')}
                    aria-label="Scroll right"
                    style={{
                        position: 'absolute',
                        right: 4,
                        top: '40%',
                        transform: 'translateY(-50%)',
                        zIndex: 20,
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: '1px solid var(--border-default)',
                        background: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <ChevronRight size={18} />
                </button>
            )}
        </div>
    );
}
