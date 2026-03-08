import { NextRequest } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { successResponse, serverError } from '@/lib/api-response';

const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

        // Always return the same response to prevent email enumeration
        const genericOk = successResponse({
            message: 'If an account with that email exists, a reset link has been sent.',
        });

        if (!email || !email.includes('@')) return genericOk;

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true },
        });

        if (!user) return genericOk; // Don't reveal whether email exists

        // Invalidate any existing tokens for this user
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        // Generate cryptographically random token
        const rawToken = randomBytes(32).toString('hex');
        const hashedToken = sha256(rawToken);
        const expiresAt = new Date(Date.now() + EXPIRY_MS);

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: hashedToken,
                expiresAt,
            },
        });

        const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
        const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

        await sendPasswordResetEmail(user.email, resetUrl);

        return genericOk;
    } catch (error) {
        console.error('POST /api/auth/forgot-password error:', error);
        return serverError();
    }
}
