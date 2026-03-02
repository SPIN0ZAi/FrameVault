'use client';

import { useRef, useState } from 'react';

interface ScrollRowProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
}

const DRAG_THRESHOLD = 6; // px before we treat it as a scroll drag

export default function ScrollRow({ children, style }: ScrollRowProps) {
    const ref = useRef<HTMLDivElement>(null);
    const drag = useRef({ pointerId: -1, x: 0, left: 0, moved: false });
    const [grabbing, setGrabbing] = useState(false);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // Only left-button / touch; ignore if already tracking
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        drag.current = { pointerId: e.pointerId, x: e.clientX, left: ref.current?.scrollLeft ?? 0, moved: false };
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (drag.current.pointerId !== e.pointerId || !ref.current) return;
        const dx = e.clientX - drag.current.x;
        if (!drag.current.moved && Math.abs(dx) > DRAG_THRESHOLD) {
            // Only capture + switch cursor once we know it's a real drag
            drag.current.moved = true;
            ref.current.setPointerCapture(e.pointerId);
            setGrabbing(true);
        }
        if (drag.current.moved) {
            ref.current.scrollLeft = drag.current.left - dx;
        }
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (drag.current.pointerId !== e.pointerId) return;
        drag.current.pointerId = -1;
        setGrabbing(false);
    };

    // Block child link / button clicks only when the pointer actually scrolled
    const onClickCapture = (e: React.MouseEvent) => {
        if (drag.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = false;
        }
    };

    return (
        <div
            ref={ref}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClickCapture={onClickCapture}
            style={{
                display: 'flex',
                gap: 'var(--space-md)',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                margin: '0 calc(var(--space-lg) * -1)',
                padding: '0 var(--space-lg) var(--space-lg)',
                // Only show grabbing during an active scroll; otherwise let children define their own cursor
                cursor: grabbing ? 'grabbing' : 'default',
                userSelect: 'none',
                ...style,
            }}
        >
            {children}
        </div>
    );
}
