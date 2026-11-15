'use client';

import { ThemeDefinition } from '@/lib/themes/types';

interface ThemedLogoProps {
    theme: ThemeDefinition;
    size?: number;
    showText?: boolean;
}

export default function ThemedLogo({ theme, size = 32, showText = true }: ThemedLogoProps) {
    const { logoVariant, colors } = theme;

    const brandColor = colors.brand;
    const accentColor = colors.brandLight;
    const innerColor = colors.bgPrimary;

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        overflow: 'visible',
                        transition: 'filter 0.3s ease',
                    }}
                >
                    {/* Defs for gradients, filters and drops */}
                    <defs>
                        <filter id="bloodGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#DC2626" floodOpacity="0.8" />
                        </filter>
                        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={brandColor} floodOpacity="0.9" />
                        </filter>
                    </defs>

                    {/* Base Vault Doors */}
                    <path
                        d="M10 30L45 15V85L10 70V30Z"
                        fill={brandColor}
                        filter={logoVariant === 'cyberpunk' || logoVariant === 'scifi' ? 'url(#neonGlow)' : undefined}
                    />
                    <path
                        d="M90 30L55 15V85L90 70V30Z"
                        fill={accentColor}
                        filter={logoVariant === 'cyberpunk' || logoVariant === 'scifi' ? 'url(#neonGlow)' : undefined}
                    />
                    <path d="M30 40H70V60H30V40Z" fill={innerColor} />

                    {/* ── Theme Specific Overlays ── */}

                    {/* Christmas: Santa hat + icicles */}
                    {logoVariant === 'christmas' && (
                        <g>
                            {/* Santa Hat on left door */}
                            <path d="M8 28 C 15 12, 35 10, 44 24" stroke="#DC2626" strokeWidth="8" strokeLinecap="round" />
                            <path d="M8 28 L 22 8 L 44 24 Z" fill="#DC2626" />
                            {/* White fur trim */}
                            <rect x="6" y="24" width="40" height="6" rx="3" fill="#FFFFFF" />
                            {/* Pom pom */}
                            <circle cx="22" cy="7" r="4.5" fill="#FFFFFF" />
                            {/* Frosted icicles on bottom */}
                            <path d="M10 70 L15 76 L20 70 L25 78 L30 70 L35 75 L40 70" stroke="#E2E8F0" strokeWidth="2" fill="none" />
                        </g>
                    )}

                    {/* Halloween: Jack-o-lantern face inside vault */}
                    {logoVariant === 'halloween' && (
                        <g>
                            {/* Carved eyes */}
                            <polygon points="38,46 44,46 41,41" fill="#FFA500" />
                            <polygon points="56,46 62,46 59,41" fill="#FFA500" />
                            {/* Sinister jagged grin */}
                            <path d="M38 53 L43 56 L48 53 L53 56 L58 53 L62 55 L58 57 L53 55 L48 58 L43 55 Z" fill="#FFA500" />
                            {/* Ghost mist */}
                            <circle cx="82" cy="22" r="3" fill="#E9D5FF" opacity="0.6" />
                        </g>
                    )}

                    {/* Thanksgiving: Golden Maple Leaf */}
                    {logoVariant === 'thanksgiving' && (
                        <g>
                            <path d="M50 36 L53 43 L60 41 L56 47 L62 52 L54 53 L56 60 L50 56 L44 60 L46 53 L38 52 L44 47 L40 41 L47 43 Z" fill="#FBBF24" />
                            <line x1="50" y1="56" x2="50" y2="64" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
                        </g>
                    )}

                    {/* Sci-Fi: Orbital Telemetry Crosshair */}
                    {logoVariant === 'scifi' && (
                        <g stroke="#38BDF8" strokeWidth="1.5">
                            <circle cx="50" cy="50" r="14" fill="none" strokeDasharray="3 3" />
                            <line x1="50" y1="32" x2="50" y2="38" />
                            <line x1="50" y1="62" x2="50" y2="68" />
                            <line x1="32" y1="50" x2="38" y2="50" />
                            <line x1="62" y1="50" x2="68" y2="50" />
                        </g>
                    )}

                    {/* Cyberpunk: Neon Glitch Cuts */}
                    {logoVariant === 'cyberpunk' && (
                        <g>
                            <line x1="5" y1="45" x2="95" y2="45" stroke="#38BDF8" strokeWidth="1.5" opacity="0.8" />
                            <rect x="25" y="47" width="50" height="4" fill="#38BDF8" opacity="0.6" />
                            <rect x="42" y="38" width="16" height="24" fill="#F43F5E" opacity="0.7" />
                        </g>
                    )}

                    {/* Fantasy: Enchanted Rune Eye */}
                    {logoVariant === 'fantasy' && (
                        <g>
                            <circle cx="50" cy="50" r="8" fill="#C084FC" opacity="0.8" />
                            <polygon points="50,38 53,47 62,50 53,53 50,62 47,53 38,50 47,47" fill="#FDE047" />
                        </g>
                    )}

                    {/* Action: Hazard Stripes */}
                    {logoVariant === 'action' && (
                        <g stroke="#FFD000" strokeWidth="2.5">
                            <line x1="34" y1="42" x2="42" y2="58" />
                            <line x1="46" y1="42" x2="54" y2="58" />
                            <line x1="58" y1="42" x2="66" y2="58" />
                        </g>
                    )}

                    {/* Romance: Rose Petal Emblem */}
                    {logoVariant === 'romance' && (
                        <g fill="#FDA4AF">
                            <circle cx="47" cy="48" r="4.5" />
                            <circle cx="53" cy="48" r="4.5" />
                            <path d="M43 51 C 45 57, 50 61, 50 61 C 50 61, 55 57, 57 51 Z" fill="#F43F5E" />
                        </g>
                    )}

                    {/* Horror Slasher: DRIPPING BLOOD EFFECT */}
                    {logoVariant === 'horror-slasher' && (
                        <g filter="url(#bloodGlow)">
                            {/* Dripping blood stream from left door */}
                            <path
                                d="M15 30 Q 18 55 18 78 Q 18 84 21 84 Q 24 84 24 78 Q 24 55 35 30 Z"
                                fill="#DC2626"
                            />
                            {/* Blood drip drop hanging/falling */}
                            <path d="M21 86 C 18 90, 18 94, 21 97 C 24 94, 24 90, 21 86 Z" fill="#DC2626" />
                            {/* Dripping blood from right door */}
                            <path
                                d="M65 30 Q 75 50 75 75 Q 75 82 78 82 Q 81 82 81 75 Q 81 50 85 30 Z"
                                fill="#991B1B"
                            />
                            <path d="M78 84 C 76 88, 76 91, 78 93 C 80 91, 80 88, 78 84 Z" fill="#991B1B" />
                            {/* Blood splatter slash across center */}
                            <line x1="28" y1="36" x2="72" y2="64" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                    )}

                    {/* Horror Shining: Overlook Hexagon Pattern */}
                    {logoVariant === 'horror-shining' && (
                        <g stroke="#C2410C" strokeWidth="2" fill="none">
                            <polygon points="50,38 60,44 60,56 50,62 40,56 40,44" fill="rgba(234, 88, 12, 0.3)" />
                            <line x1="50" y1="38" x2="50" y2="62" />
                            <line x1="40" y1="44" x2="60" y2="56" />
                        </g>
                    )}

                    {/* Horror Alien: Nostromo Phosphor CRT Radar */}
                    {logoVariant === 'horror-alien' && (
                        <g stroke="#4ADE80" strokeWidth="1.5">
                            <circle cx="50" cy="50" r="10" fill="none" />
                            <polygon points="50,42 54,49 46,49" fill="#22C55E" />
                            <line x1="50" y1="50" x2="58" y2="43" stroke="#86EFAC" strokeWidth="2" />
                        </g>
                    )}

                    {/* Horror Vampire: Bat Wings & Gothic Arch */}
                    {logoVariant === 'horror-vampire' && (
                        <g fill="#A855F7">
                            <path d="M50 36 C 45 42, 35 45, 30 40 C 35 50, 45 54, 50 62 C 55 54, 65 50, 70 40 C 65 45, 55 42, 50 36 Z" fill="#6B21A8" />
                            <circle cx="50" cy="62" r="3" fill="#E11D48" />
                        </g>
                    )}

                    {/* Horror Lovecraft: Abyssal Eye */}
                    {logoVariant === 'horror-lovecraft' && (
                        <g>
                            <path d="M36 50 Q 50 38 64 50 Q 50 62 36 50 Z" fill="#042F2E" stroke="#14B8A6" strokeWidth="1.5" />
                            <ellipse cx="50" cy="50" rx="3" ry="5.5" fill="#5EEAD4" />
                            <circle cx="50" cy="50" r="1.5" fill="#042F2E" />
                        </g>
                    )}
                </svg>
            </div>

            {showText && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                        style={{
                            fontWeight: 800,
                            fontSize: '1.125rem',
                            letterSpacing: '-0.02em',
                            color: colors.textPrimary,
                            textShadow: theme.id !== 'default' ? `0 0 16px ${colors.accentGlow}` : undefined,
                            transition: 'color 0.3s ease',
                        }}
                    >
                        FrameVault
                    </span>
                    {theme.id !== 'default' && (
                        <span
                            style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: brandColor,
                                marginTop: -2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                            }}
                        >
                            <span>{theme.icon}</span>
                            <span>{theme.name}</span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
