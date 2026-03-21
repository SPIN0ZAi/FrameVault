import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, serverError, validationError } from '@/lib/api-response';
import { z } from 'zod';

const updateMeSchema = z.object({
    displayName: z.string().trim().max(50, 'Display name must be at most 50 characters').optional().nullable(),
    bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
    location: z.string().max(100, 'Location must be at most 100 characters').optional(),
    avatarUrl: z.string().url('Invalid avatar URL').max(2048).optional().nullable(),
    bannerUrl: z.string().url('Invalid banner URL').max(2048).optional().nullable(),
    themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
    themeMode: z.enum(['light', 'dark', 'system']).optional(),
    bannerPosition: z.string().regex(/^(100|[1-9]?[0-9])(\.[0-9]+)?% (100|[1-9]?[0-9])(\.[0-9]+)?%$/).max(25).optional().nullable(),
    avatarPosition: z.string().regex(/^(100|[1-9]?[0-9])(\.[0-9]+)?% (100|[1-9]?[0-9])(\.[0-9]+)?%$/).max(25).optional().nullable(),
    backdropBrightness: z.number().int().min(5).max(75).optional(),
    traktUsername: z.string().max(100).optional().nullable(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                createdAt: true,
                profile: true,
            },
        });

        if (!user) return unauthorizedError();
        return successResponse(user);
    } catch (error) {
        console.error('GET /api/users/me error:', error);
        return serverError();
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const raw = await req.json();
        const parsed = updateMeSchema.safeParse(raw);
        if (!parsed.success) {
            return validationError(parsed.error.issues[0].message);
        }
        const { displayName, bio, location, avatarUrl, bannerUrl, themeColor, themeMode, bannerPosition, avatarPosition, backdropBrightness, traktUsername } = parsed.data;

        const userId = session.user.id;

        // Update User Profile (bio, location, banner, theme, trakt)
        if (displayName !== undefined || bio !== undefined || location !== undefined || bannerUrl !== undefined || themeColor !== undefined || themeMode !== undefined || bannerPosition !== undefined || avatarPosition !== undefined || backdropBrightness !== undefined || traktUsername !== undefined) {
            await prisma.userProfile.upsert({
                where: { userId },
                update: {
                    ...(displayName !== undefined && { displayName: displayName?.trim() || null }),
                    ...(bio !== undefined && { bio }),
                    ...(location !== undefined && { location }),
                    ...(bannerUrl !== undefined && { bannerUrl }),
                    ...(themeColor !== undefined && { themeColor }),
                    ...(themeMode !== undefined && { themeMode }),
                    ...(bannerPosition !== undefined && { bannerPosition }),
                    ...(avatarPosition !== undefined && { avatarPosition }),
                    ...(backdropBrightness !== undefined && { backdropBrightness }),
                    ...(traktUsername !== undefined && { traktUsername }),
                },
                create: {
                    userId,
                    displayName: displayName?.trim() || null,
                    bio,
                    location,
                    bannerUrl,
                    themeColor: themeColor || '#00D1C1',
                    themeMode: themeMode || 'dark',
                    bannerPosition: bannerPosition ?? '50% 50%',
                    avatarPosition: avatarPosition ?? '50% 50%',
                    backdropBrightness: backdropBrightness ?? 60,
                    traktUsername: traktUsername ?? null,
                }
            });
        }

        // Update User avatar
        if (avatarUrl !== undefined) {
            await prisma.user.update({
                where: { id: userId },
                data: { avatarUrl },
            });
        }

        return successResponse({ updated: true });
    } catch (error) {
        console.error('Update Profile Error:', error);
        return serverError('Failed to update profile');
    }
}
