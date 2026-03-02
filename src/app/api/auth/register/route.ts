import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { registerSchema } from '@/lib/validators';
import { successResponse, validationError, errorResponse, serverError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const result = registerSchema.safeParse(body);
        if (!result.success) {
            const firstError = result.error.issues[0];
            return validationError(firstError.message, result.error.issues.map(e => ({
                field: e.path.map(String).join('.'),
                issue: e.message,
            })));
        }

        const { email, username, password } = result.data;

        // Check if email already exists
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            return errorResponse(
                { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' },
                409
            );
        }

        // Check if username already exists
        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) {
            return errorResponse(
                { code: 'USERNAME_TAKEN', message: 'This username is already taken' },
                409
            );
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                username,
                passwordHash,
                profile: {
                    create: {}, // Create default profile
                },
            },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
            },
        });

        return successResponse(user, undefined);
    } catch (error) {
        console.error('Registration error:', error);
        return serverError();
    }
}
