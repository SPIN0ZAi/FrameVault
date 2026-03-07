import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { successResponse, unauthorizedError, serverError, validationError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return validationError('Both current and new password are required');
        }
        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return validationError('New password must be at least 8 characters');
        }
        if (!/[a-z]/.test(newPassword)) return validationError('New password must contain a lowercase letter');
        if (!/[A-Z]/.test(newPassword)) return validationError('New password must contain an uppercase letter');
        if (!/[0-9]/.test(newPassword)) return validationError('New password must contain a number');
        if (newPassword.length > 128) return validationError('New password must be at most 128 characters');

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { passwordHash: true },
        });

        if (!user?.passwordHash) {
            return validationError('No password set on this account');
        }

        const valid = await verifyPassword(currentPassword, user.passwordHash);
        if (!valid) {
            return validationError('Current password is incorrect');
        }

        const newHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash: newHash },
        });

        return successResponse({ updated: true });
    } catch (error) {
        console.error('POST /api/auth/change-password error:', error);
        return serverError();
    }
}
