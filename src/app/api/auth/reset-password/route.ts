import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { successResponse, serverError, validationError } from '@/lib/api-response';

function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { token, password } = body ?? {};

        if (!token || typeof token !== 'string' || token.length !== 64) {
            return validationError('Invalid or missing reset token');
        }

        // Password strength (matches change-password requirements)
        if (!password || typeof password !== 'string') {
            return validationError('Password is required');
        }
        if (password.length < 8)  return validationError('Password must be at least 8 characters');
        if (password.length > 128) return validationError('Password must be at most 128 characters');
        if (!/[a-z]/.test(password)) return validationError('Password must contain a lowercase letter');
        if (!/[A-Z]/.test(password)) return validationError('Password must contain an uppercase letter');
        if (!/[0-9]/.test(password)) return validationError('Password must contain a number');

        const hashedToken = sha256(token);

        const record = await prisma.passwordResetToken.findUnique({
            where: { token: hashedToken },
            select: { id: true, userId: true, expiresAt: true, usedAt: true },
        });

        if (!record) return validationError('Invalid or expired reset link');
        if (record.usedAt) return validationError('This reset link has already been used');
        if (record.expiresAt < new Date()) return validationError('This reset link has expired');

        const newHash = await hashPassword(password);

        // Update password and mark token used in a transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: record.userId },
                data: { passwordHash: newHash },
            }),
            prisma.passwordResetToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
        ]);

        return successResponse({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('POST /api/auth/reset-password error:', error);
        return serverError();
    }
}
