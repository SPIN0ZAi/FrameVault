'use client';

import { useEffect, useRef } from 'react';
import { AmbientEffectType } from '@/lib/themes/types';

interface AmbientCanvasProps {
    effect: AmbientEffectType;
    enabled: boolean;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    color: string;
    rotation?: number;
    vRot?: number;
    pulse?: number;
    vPulse?: number;
}

export default function AmbientCanvas({ effect, enabled }: AmbientCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!enabled || effect === 'none') return;

        // Check prefers-reduced-motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let isRunning = true;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Pause animation when tab is not visible to save CPU/battery
        const handleVisibilityChange = () => {
            isRunning = !document.hidden;
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Initialize particles based on effect type
        const particles: Particle[] = [];
        const count = effect === 'snow' ? 50
            : effect === 'autumn-leaves' ? 25
            : effect === 'halloween-fog' ? 20
            : effect === 'magic-sparkles' ? 35
            : effect === 'action-embers' ? 35
            : effect === 'rose-petals' ? 20
            : effect === 'noir-rain' ? 65
            : effect === 'matrix-rain' ? 30
            : effect === 'bats-fog' ? 16
            : effect === 'cosmic-void' ? 30
            : 20;

        for (let i = 0; i < count; i++) {
            particles.push(createParticle(effect, width, height));
        }

        function createParticle(type: AmbientEffectType, w: number, h: number): Particle {
            const x = Math.random() * w;
            const y = Math.random() * h;

            switch (type) {
                case 'snow':
                    return {
                        x,
                        y,
                        vx: (Math.random() - 0.5) * 0.8,
                        vy: 0.8 + Math.random() * 1.5,
                        size: 1.5 + Math.random() * 3,
                        alpha: 0.3 + Math.random() * 0.6,
                        color: '#F8FAFC',
                    };
                case 'autumn-leaves':
                    return {
                        x,
                        y,
                        vx: 0.5 + Math.random() * 1.2,
                        vy: 0.8 + Math.random() * 1.4,
                        size: 6 + Math.random() * 8,
                        alpha: 0.6 + Math.random() * 0.35,
                        color: ['#D97706', '#F59E0B', '#DC2626', '#B45309'][Math.floor(Math.random() * 4)],
                        rotation: Math.random() * Math.PI * 2,
                        vRot: (Math.random() - 0.5) * 0.04,
                    };
                case 'action-embers':
                    return {
                        x,
                        y,
                        vx: (Math.random() - 0.5) * 1.2,
                        vy: -(1.2 + Math.random() * 2), // Float up
                        size: 1.5 + Math.random() * 3,
                        alpha: 0.4 + Math.random() * 0.5,
                        color: ['#FF3300', '#FF6633', '#FFAA00'][Math.floor(Math.random() * 3)],
                        pulse: Math.random(),
                        vPulse: 0.03,
                    };
                case 'rose-petals':
                    return {
                        x,
                        y,
                        vx: (Math.random() - 0.5) * 0.7,
                        vy: 0.6 + Math.random() * 1.2,
                        size: 5 + Math.random() * 6,
                        alpha: 0.45 + Math.random() * 0.4,
                        color: ['#EC4899', '#F43F5E', '#FDA4AF'][Math.floor(Math.random() * 3)],
                        rotation: Math.random() * Math.PI * 2,
                        vRot: (Math.random() - 0.5) * 0.03,
                    };
                case 'noir-rain':
                    return {
                        x,
                        y,
                        vx: -1.5,
                        vy: 9 + Math.random() * 5,
                        size: 12 + Math.random() * 12, // streak length
                        alpha: 0.2 + Math.random() * 0.3,
                        color: '#94A3B8',
                    };
                case 'magic-sparkles':
                    return {
                        x,
                        y,
                        vx: (Math.random() - 0.5) * 0.4,
                        vy: (Math.random() - 0.5) * 0.4,
                        size: 2 + Math.random() * 4,
                        alpha: 0.2 + Math.random() * 0.6,
                        color: ['#C084FC', '#E879F9', '#FDE047', '#38BDF8'][Math.floor(Math.random() * 4)],
                        pulse: Math.random(),
                        vPulse: 0.02 + Math.random() * 0.03,
                    };
                case 'bats-fog':
                    return {
                        x,
                        y: Math.random() * (h * 0.6), // Bats stay in upper 60%
                        vx: (Math.random() > 0.5 ? 1 : -1) * (1.8 + Math.random() * 2.2),
                        vy: (Math.random() - 0.5) * 1.2,
                        size: 8 + Math.random() * 8,
                        alpha: 0.5 + Math.random() * 0.4,
                        color: '#1A0B1E',
                        rotation: 0,
                        vRot: 0.05,
                    };
                case 'halloween-fog':
                case 'cosmic-void':
                default:
                    return {
                        x,
                        y,
                        vx: (Math.random() - 0.5) * 0.6,
                        vy: (Math.random() - 0.5) * 0.6,
                        size: 25 + Math.random() * 45, // Soft fog motes
                        alpha: 0.05 + Math.random() * 0.12,
                        color: type === 'cosmic-void' ? '#0D9488' : '#7E22CE',
                        pulse: Math.random(),
                        vPulse: 0.01,
                    };
            }
        }

        let tick = 0;

        const render = () => {
            if (!isRunning) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            tick++;
            ctx.clearRect(0, 0, width, height);

            // Special radar sweep effect for scifi & alien
            if (effect === 'radar-scan') {
                const scanY = (tick * 1.8) % height;
                const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY);
                grad.addColorStop(0, 'rgba(34, 197, 94, 0)');
                grad.addColorStop(1, 'rgba(34, 197, 94, 0.06)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, scanY - 30, width, 30);
            }

            // Draw and update particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                ctx.save();

                if (effect === 'snow') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(248, 250, 252, ${p.alpha})`;
                    ctx.fill();
                } else if (effect === 'noir-rain') {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.vx, p.y + p.size);
                    ctx.strokeStyle = `rgba(148, 163, 184, ${p.alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else if (effect === 'autumn-leaves' || effect === 'rose-petals') {
                    ctx.translate(p.x, p.y);
                    if (p.rotation !== undefined) ctx.rotate(p.rotation);
                    ctx.beginPath();
                    ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.alpha;
                    ctx.fill();
                } else if (effect === 'bats-fog') {
                    ctx.translate(p.x, p.y);
                    const wingSpread = Math.sin(tick * 0.2 + i) * 6;
                    ctx.fillStyle = '#080308';
                    ctx.globalAlpha = p.alpha;
                    // Stylized bat silhouette
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-p.size, -wingSpread);
                    ctx.lineTo(-p.size * 0.5, p.size * 0.4);
                    ctx.lineTo(0, p.size * 0.3);
                    ctx.lineTo(p.size * 0.5, p.size * 0.4);
                    ctx.lineTo(p.size, -wingSpread);
                    ctx.closePath();
                    ctx.fill();
                } else if (effect === 'magic-sparkles' || effect === 'action-embers') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    const currentAlpha = p.pulse !== undefined
                        ? p.alpha * (0.6 + 0.4 * Math.sin(tick * 0.05 + p.pulse * 10))
                        : p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = Math.max(0.1, currentAlpha);
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = p.color;
                    ctx.fill();
                } else {
                    // Soft atmospheric clouds / motes
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.alpha;
                    ctx.fill();
                }

                ctx.restore();

                // Move particle
                p.x += p.vx;
                p.y += p.vy;
                if (p.rotation !== undefined && p.vRot !== undefined) {
                    p.rotation += p.vRot;
                }

                // Wrap boundaries
                if (p.y > height + 20) {
                    p.y = -10;
                    p.x = Math.random() * width;
                } else if (p.y < -20) {
                    p.y = height + 10;
                    p.x = Math.random() * width;
                }
                if (p.x > width + 20) {
                    p.x = -10;
                } else if (p.x < -20) {
                    p.x = width + 10;
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cancelAnimationFrame(animationFrameId);
        };
    }, [effect, enabled]);

    if (!enabled || effect === 'none') return null;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 1, // Directly above background surfaces, behind interactive cards and modals
                opacity: 0.85,
            }}
        />
    );
}
