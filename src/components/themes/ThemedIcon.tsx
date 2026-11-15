'use client';

import React from 'react';

interface ThemedIconProps {
    themeId: string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
    primaryColor?: string;
    secondaryColor?: string;
}

export default function ThemedIcon({
    themeId,
    size = 20,
    className,
    style,
    primaryColor,
    secondaryColor,
}: ThemedIconProps) {
    const s = size;

    switch (themeId) {
        // ── 1. FrameVault Classic ──
        case 'default':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke={primaryColor || '#00D1C1'} strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="5" stroke={secondaryColor || '#33EAD4'} strokeWidth="1.8" strokeDasharray="3 2" />
                    <circle cx="12" cy="12" r="2" fill={primaryColor || '#00D1C1'} />
                    <path d="M12 3V6M12 18V21M3 12H6M18 12H21" stroke={primaryColor || '#00D1C1'} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            );

        // ── 2. Winter Wonderland (Christmas) ──
        case 'christmas':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Snowflake Crystal & Pine Stars */}
                    <path d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M4.93 19.07L19.07 4.93" stroke={primaryColor || '#E02424'} strokeWidth="1.6" strokeLinecap="round" />
                    {/* Crystal Branches */}
                    <path d="M12 5L9.5 7.5M12 5L14.5 7.5M12 19L9.5 16.5M12 19L14.5 16.5" stroke={secondaryColor || '#F87171'} strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M5 12L7.5 9.5M5 12L7.5 14.5M19 12L16.5 9.5M19 12L16.5 14.5" stroke={secondaryColor || '#F87171'} strokeWidth="1.4" strokeLinecap="round" />
                    {/* Festive Center Gem */}
                    <circle cx="12" cy="12" r="2.2" fill={primaryColor || '#E02424'} />
                </svg>
            );

        // ── 3. Spooky All Hallows (Halloween) ──
        case 'halloween':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Pumpkin Stem */}
                    <path d="M12 2C12 2 13 4 14 5" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" />
                    {/* Carved Jack-o'-Lantern Outline */}
                    <path
                        d="M12 5C7.5 5 4 8 4 12.5C4 17 7.5 21 12 21C16.5 21 20 17 20 12.5C20 8 16.5 5 12 5Z"
                        stroke={primaryColor || '#FF6B00'}
                        strokeWidth="1.8"
                    />
                    <path d="M8.5 5.5C7 8 7 17 8.5 20.5M15.5 5.5C17 8 17 17 15.5 20.5" stroke={primaryColor || '#FF6B00'} strokeWidth="1.2" opacity="0.6" />
                    {/* Sinister Carved Eyes */}
                    <polygon points="8,11 10,11 9,9" fill={secondaryColor || '#FFA149'} />
                    <polygon points="14,11 16,11 15,9" fill={secondaryColor || '#FFA149'} />
                    {/* Jagged Grin */}
                    <path d="M8 15L9.5 14L11 15.5L12 14.5L13 15.5L14.5 14L16 15" stroke={secondaryColor || '#FFA149'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );

        // ── 4. Autumn Harvest (Thanksgiving) ──
        case 'thanksgiving':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Authentic Maple Leaf Emblem */}
                    <path
                        d="M12 3L13.5 6.5L17 5.5L15.5 9L19 11.5L15.5 13L16.5 16.5L12.5 15L12 21L11.5 15L7.5 16.5L8.5 13L5 11.5L8.5 9L7 5.5L10.5 6.5L12 3Z"
                        stroke={primaryColor || '#EA580C'}
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                        fill="rgba(234, 88, 12, 0.15)"
                    />
                    {/* Leaf Veins */}
                    <line x1="12" y1="7" x2="12" y2="18" stroke={secondaryColor || '#F59E0B'} strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="12" y1="10" x2="15" y2="8" stroke={secondaryColor || '#F59E0B'} strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="12" y1="10" x2="9" y2="8" stroke={secondaryColor || '#F59E0B'} strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="12" y1="13" x2="15" y2="12" stroke={secondaryColor || '#F59E0B'} strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="12" y1="13" x2="9" y2="12" stroke={secondaryColor || '#F59E0B'} strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            );

        // ── 5. Cinéma d'Auteur (Drama) ──
        case 'drama':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Theatrical Drama Masks */}
                    <path
                        d="M3 6C3 4.5 4.5 3 6.5 3C8.5 3 10 4.5 10 6V11C10 14.5 7 16 6.5 16C6 16 3 14.5 3 11V6Z"
                        stroke={primaryColor || '#D97706'}
                        strokeWidth="1.6"
                    />
                    <circle cx="5.5" cy="7.5" r="1" fill={primaryColor || '#D97706'} />
                    <circle cx="7.5" cy="7.5" r="1" fill={primaryColor || '#D97706'} />
                    <path d="M5 12C5.5 13 7.5 13 8 12" stroke={secondaryColor || '#FBBF24'} strokeWidth="1.3" strokeLinecap="round" />

                    {/* Second mask behind */}
                    <path
                        d="M14 8C14 6.5 15.5 5 17.5 5C19.5 5 21 6.5 21 8V13C21 16.5 18 18 17.5 18C17 18 14 16.5 14 13V8Z"
                        stroke={secondaryColor || '#FBBF24'}
                        strokeWidth="1.6"
                    />
                    <circle cx="16.5" cy="9.5" r="1" fill={secondaryColor || '#FBBF24'} />
                    <circle cx="18.5" cy="9.5" r="1" fill={secondaryColor || '#FBBF24'} />
                    <path d="M16 14.5C16.5 13.5 18.5 13.5 19 14.5" stroke={primaryColor || '#D97706'} strokeWidth="1.3" strokeLinecap="round" />
                </svg>
            );

        // ── 6. Arcane Realms (Fantasy) ──
        case 'fantasy':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Mystic Runed Astral Seal */}
                    <circle cx="12" cy="12" r="9" stroke={primaryColor || '#9333EA'} strokeWidth="1.5" strokeDasharray="3 2" />
                    {/* Eight-pointed Star */}
                    <polygon
                        points="12,3 14,9 20,8 16,13 19,19 13,16 12,21 11,16 5,19 8,13 4,8 10,9"
                        stroke={secondaryColor || '#C084FC'}
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        fill="rgba(147, 51, 234, 0.2)"
                    />
                    <circle cx="12" cy="12" r="2" fill="#FDE047" />
                </svg>
            );

        // ── 7. Galactic Horizon (Sci-Fi) ──
        case 'scifi':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Telemetry Orbit HUD */}
                    <circle cx="12" cy="12" r="8" stroke={primaryColor || '#0284C7'} strokeWidth="1.6" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={secondaryColor || '#38BDF8'} strokeWidth="1.4" strokeDasharray="4 2" transform="rotate(-25 12 12)" />
                    {/* Targeting Crosshairs */}
                    <line x1="12" y1="2" x2="12" y2="6" stroke={secondaryColor || '#38BDF8'} strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke={secondaryColor || '#38BDF8'} strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="2" y1="12" x2="6" y2="12" stroke={secondaryColor || '#38BDF8'} strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="18" y1="12" x2="22" y2="12" stroke={secondaryColor || '#38BDF8'} strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="2.5" fill={primaryColor || '#0284C7'} />
                </svg>
            );

        // ── 8. Moonlit Velvet (Romance) ──
        case 'romance':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Layered Blooming Rose Motif */}
                    <path
                        d="M12 4C8.5 4 6 6.5 6 9.5C6 14.5 12 19 12 19C12 19 18 14.5 18 9.5C18 6.5 15.5 4 12 4Z"
                        stroke={primaryColor || '#E11D48'}
                        strokeWidth="1.6"
                        fill="rgba(225, 29, 72, 0.18)"
                    />
                    <path d="M12 8C10.5 8 9.5 9 9.5 10.5C9.5 13 12 15 12 15C12 15 14.5 13 14.5 10.5C14.5 9 13.5 8 12 8Z" stroke={secondaryColor || '#FB7185'} strokeWidth="1.4" fill="rgba(244, 63, 94, 0.3)" />
                    <path d="M12 19V22M9.5 20.5C10.5 21 11.5 21 12 21" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
            );

        // ── 9. Fury Protocol (Action) ──
        case 'action':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Kinetic Combustion Lightning Shield */}
                    <path d="M12 2L4 5V11C4 16.5 7.5 21.5 12 23C16.5 21.5 20 16.5 20 11V5L12 2Z" stroke={primaryColor || '#EA580C'} strokeWidth="1.6" />
                    <polygon
                        points="13,6 7,13 12,13 11,18 17,11 12,11"
                        fill={secondaryColor || '#FBBF24'}
                        stroke="#B45309"
                        strokeWidth="0.8"
                    />
                </svg>
            );

        // ── 10. Midnight Noir (Mystery / Thriller) ──
        case 'mystery':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Detective Fedora & Magnifying Slit */}
                    <path d="M2 17C4.5 16 8 15.5 12 15.5C16 15.5 19.5 16 22 17" stroke={primaryColor || '#D97706'} strokeWidth="1.8" strokeLinecap="round" />
                    <path
                        d="M5.5 15.5C5.5 15.5 6 9 8 7C9.5 5.5 14.5 5.5 16 7C18 9 18.5 15.5 18.5 15.5"
                        stroke={primaryColor || '#D97706'}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                    <path d="M6 13C8 12.5 16 12.5 18 13" stroke={secondaryColor || '#FDE68A'} strokeWidth="2.2" strokeLinecap="round" />
                    {/* Slit Shadows */}
                    <line x1="8" y1="18.5" x2="16" y2="18.5" stroke={primaryColor || '#D97706'} strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="9" y1="21" x2="15" y2="21" stroke={primaryColor || '#D97706'} strokeWidth="1.4" strokeLinecap="round" />
                </svg>
            );

        // ── 11. Terra Incognita (Adventure) ──
        case 'adventure':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Compass Rose Navigation Star */}
                    <circle cx="12" cy="12" r="9" stroke={primaryColor || '#D97706'} strokeWidth="1.6" />
                    <circle cx="12" cy="12" r="7.5" stroke={secondaryColor || '#FBBF24'} strokeWidth="0.8" strokeDasharray="2 2" />
                    {/* North Needle */}
                    <polygon points="12,4 14,12 12,10" fill={primaryColor || '#D97706'} />
                    <polygon points="12,4 10,12 12,10" fill={secondaryColor || '#FBBF24'} />
                    {/* South Needle */}
                    <polygon points="12,20 14,12 12,14" fill={secondaryColor || '#FBBF24'} />
                    <polygon points="12,20 10,12 12,14" fill={primaryColor || '#D97706'} />
                    {/* Center Pivot */}
                    <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
                </svg>
            );

        // ── 12. Toon Pop (Animation) ──
        case 'animation':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Pop-Art Comic Sparkle & Burst */}
                    <path
                        d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
                        stroke={primaryColor || '#2563EB'}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                        fill="rgba(59, 130, 246, 0.2)"
                    />
                    <circle cx="18" cy="5" r="2" fill={secondaryColor || '#FACC15'} />
                    <circle cx="6" cy="17" r="1.5" fill={secondaryColor || '#FACC15'} />
                    <circle cx="19" cy="17" r="1.2" fill={primaryColor || '#2563EB'} />
                </svg>
            );

        // ── 13. 35mm Reel Archive (Documentary) ──
        case 'documentary':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Vintage 35mm Film Reel Spool */}
                    <circle cx="12" cy="12" r="9" stroke={primaryColor || '#78716C'} strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3.5" stroke={primaryColor || '#78716C'} strokeWidth="1.4" />
                    {/* Film Spool Holes */}
                    <circle cx="12" cy="6.2" r="1.4" fill={secondaryColor || '#D6D3D1'} />
                    <circle cx="12" cy="17.8" r="1.4" fill={secondaryColor || '#D6D3D1'} />
                    <circle cx="6.2" cy="12" r="1.4" fill={secondaryColor || '#D6D3D1'} />
                    <circle cx="17.8" cy="12" r="1.4" fill={secondaryColor || '#D6D3D1'} />
                    <circle cx="12" cy="12" r="1.5" fill={primaryColor || '#78716C'} />
                </svg>
            );

        // ── 14. Neo Shinjuku 2099 (Cyberpunk) ──
        case 'cyberpunk':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Cybernetic HUD Visor with Glitch Cuts */}
                    <polygon
                        points="3,7 12,3 21,7 21,15 12,21 3,15"
                        stroke={primaryColor || '#D946EF'}
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    {/* Cyber Glitch Laser Bar */}
                    <line x1="2" y1="12" x2="22" y2="12" stroke={secondaryColor || '#06B6D4'} strokeWidth="1.8" />
                    <rect x="7" y="10" width="10" height="4" fill={secondaryColor || '#06B6D4'} opacity="0.6" />
                    <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
                </svg>
            );

        // ── 15. Bloodbath: 1984 (Slasher Horror) ──
        case 'horror-slasher':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Iconic Slasher Hunting Machete / Blade with Dripping Blood */}
                    <path
                        d="M19 3L7 15L9 17L21 5C21.5 4.5 21.5 3.5 21 3C20.5 2.5 19.5 2.5 19 3Z"
                        fill="#CBD5E1"
                        stroke="#64748B"
                        strokeWidth="0.8"
                    />
                    {/* Handle */}
                    <path d="M7 15L3 19L5 21L9 17L7 15Z" fill="#334155" stroke="#0F172A" strokeWidth="1" />
                    {/* Guard */}
                    <line x1="6" y1="14" x2="10" y2="18" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
                    {/* Blood Splatter Along Blade Edge */}
                    <path d="M12 10Q14 13 13 15Q12 17 14 17Q16 17 15 13Q14 9 17 7" fill={primaryColor || '#DC2626'} />
                    {/* Falling Blood Droplets */}
                    <circle cx="13" cy="19.5" r="1.4" fill={primaryColor || '#DC2626'} />
                    <circle cx="17" cy="16" r="1" fill={primaryColor || '#DC2626'} />
                </svg>
            );

        // ── 16. Room 237: Overlook (The Shining) ──
        case 'horror-shining':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Overlook Hexagonal Carpet Maze Pattern */}
                    <polygon
                        points="12,2 19,6 19,14 12,18 5,14 5,6"
                        stroke={primaryColor || '#C2410C'}
                        strokeWidth="1.6"
                        fill="rgba(194, 65, 12, 0.2)"
                    />
                    <polygon points="12,6 16,8.5 16,13.5 12,16 8,13.5 8,8.5" stroke={secondaryColor || '#EA580C'} strokeWidth="1.3" />
                    {/* Overlook Room Key Slit */}
                    <line x1="12" y1="9" x2="12" y2="13" stroke="#FDE047" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M12 18V22M9 22H15" stroke={primaryColor || '#C2410C'} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            );

        // ── 17. Nostromo LV-426 (Alien Horror) ──
        case 'horror-alien':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Phosphor CRT Motion Tracker Display */}
                    <circle cx="12" cy="12" r="9" stroke={primaryColor || '#16A34A'} strokeWidth="1.6" />
                    <circle cx="12" cy="12" r="5" stroke={primaryColor || '#16A34A'} strokeWidth="1.2" strokeDasharray="3 2" />
                    {/* Radar Sweep Arc */}
                    <path d="M12 12L19 7" stroke={secondaryColor || '#4ADE80'} strokeWidth="1.8" strokeLinecap="round" />
                    {/* Biomorphic Signal Blip (Xenomorph tracker) */}
                    <circle cx="16" cy="9" r="1.8" fill={secondaryColor || '#4ADE80'} />
                    <circle cx="16" cy="9" r="3.2" stroke={secondaryColor || '#4ADE80'} strokeWidth="0.8" opacity="0.6" />
                </svg>
            );

        // ── 18. Nosferatu’s Crypt (Gothic Vampire) ──
        case 'horror-vampire':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Gothic Arch & Outstretched Gargoyle Bat Wings */}
                    <path
                        d="M12 3C8 3 5 7 5 11V21H19V11C19 7 16 3 12 3Z"
                        stroke={primaryColor || '#9333EA'}
                        strokeWidth="1.5"
                    />
                    {/* Bat Wings Crest */}
                    <path
                        d="M12 8C10 11 6 12 4 10C6 14 10 15 12 18C14 15 18 14 20 10C18 12 14 11 12 8Z"
                        fill={secondaryColor || '#A855F7'}
                        stroke="#581C87"
                        strokeWidth="0.8"
                    />
                    {/* Blood Drop Ruby */}
                    <circle cx="12" cy="18" r="1.5" fill="#E11D48" />
                </svg>
            );

        // ── 19. Eldritch Abyss (Lovecraftian Horror) ──
        case 'horror-lovecraft':
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    {/* Abyssal Cyclopean Eye Wrapped in Deep Sea Tendrils */}
                    <path
                        d="M3 12C6 7 18 7 21 12C18 17 6 17 3 12Z"
                        stroke={primaryColor || '#0D9488'}
                        strokeWidth="1.6"
                        fill="rgba(13, 148, 136, 0.2)"
                    />
                    {/* Vertical Cat-Slit Abyssal Pupil */}
                    <ellipse cx="12" cy="12" rx="2.5" ry="4.5" fill={secondaryColor || '#14B8A6'} />
                    <ellipse cx="12" cy="12" rx="1.2" ry="3.5" fill="#042F2E" />
                    {/* Writhing Tentacles */}
                    <path d="M5 16C4 18 3 20 2 21M19 16C20 18 21 20 22 21" stroke={primaryColor || '#0D9488'} strokeWidth="1.4" strokeLinecap="round" />
                </svg>
            );

        // ── Fallback ──
        default:
            return (
                <svg
                    width={s}
                    height={s}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={className}
                    style={{ flexShrink: 0, ...style }}
                >
                    <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="2" fill="var(--brand)" />
                </svg>
            );
    }
}
