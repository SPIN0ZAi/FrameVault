import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';

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

        const body = await req.json();
        const { bio, location, avatarUrl, bannerUrl, themeColor, themeMode } = body;

        const userId = session.user.id;

        // Update User Profile (bio, location, banner, theme)
        if (bio !== undefined || location !== undefined || bannerUrl !== undefined || themeColor !== undefined || themeMode !== undefined) {
            await prisma.userProfile.upsert({
                where: { userId },
                update: {
                    ...(bio !== undefined && { bio }),
                    ...(location !== undefined && { location }),
                    ...(bannerUrl !== undefined && { bannerUrl }),
                    ...(themeColor !== undefined && { themeColor }),
                    ...(themeMode !== undefined && { themeMode }),
                },
                create: {
                    userId,
                    bio,
                    location,
                    bannerUrl,
                    themeColor: themeColor || '#00D1C1',
                    themeMode: themeMode || 'dark',
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
