'use client';

import { useRef, useState } from 'react';

interface ScrollRowProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
}

/**
 * A horizontal scroll container that supports drag-to-scroll on desktop.
 * - Pointer capture keeps the drag active even when the cursor leaves the element.
 * - onClickCapture cancels child link clicks when the user actually dragged.
 * - Touch devices use native momentum scroll (overflow-x: auto + WebkitOverflowScrolling).
 */
export default function ScrollRow({ children, style }: ScrollRowProps) {
    const ref = useRef<HTMLDivElement>(null);
    const activeRef = useRef(false);
    const drag = useRef({ x: 0, left: 0, moved: false });
    const [grabbing, setGrabbing] = useState(false);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        activeRef.current = true;
        drag.current = { x: e.clientX, left: ref.current?.scrollLeft ?? 0, moved: false };
        // Capture so pointermove keeps firing even when the cursor leaves the element
        ref.current?.setPointerCapture(e.pointerId);
        setGrabbing(true);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!activeRef.current || !ref.current) return;
        const dx = e.clientX - drag.current.x;
        if (Math.abs(dx) > 5) drag.current.moved = true;
        if (drag.current.moved) ref.current.scrollLeft = drag.current.left - dx;
    };

    const onPointerUp = () => {
        activeRef.current = false;
        setGrabbing(false);
    };

    // Block child link / button clicks when the pointer actually moved (i.e. it was a drag, not a tap)
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
                cursor: grabbing ? 'grabbing' : 'grab',
                userSelect: 'none',
                ...style,
            }}
        >
            {children}
        </div>
    );
}
