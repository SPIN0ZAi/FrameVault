import { z } from 'zod';

// ─── AUTH ──────────────────────────────────────────

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain a lowercase letter')
        .regex(/[A-Z]/, 'Password must contain an uppercase letter')
        .regex(/[0-9]/, 'Password must contain a number'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// ─── MOVIES ────────────────────────────────────────

export const createMovieSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200).trim(),
    year: z
        .number()
        .int()
        .min(1888, 'Year must be 1888 or later')
        .max(new Date().getFullYear() + 2, 'Year cannot be that far in the future'),
    description: z.string().max(5000).optional(),
    genreIds: z.array(z.string()).max(10).optional(),
    posterUrl: z.string().url().optional(),
});

// ─── RATINGS ───────────────────────────────────────

export const ratingSchema = z.object({
    value: z
        .number()
        .min(1, 'Rating must be at least 1')
    .max(10, 'Rating must be at most 10')
    .refine((v) => Math.round(v * 2) === v * 2, 'Rating must be in 0.5 steps'),
});

// ─── REVIEWS ───────────────────────────────────────

export const reviewSchema = z.object({
    content: z
        .string()
        .min(10, 'Review must be at least 10 characters')
        .max(10000, 'Review must be at most 10,000 characters')
        .trim(),
    containsSpoilers: z.boolean().default(false),
});

// ─── PROFILE ───────────────────────────────────────

export const updateProfileSchema = z.object({
    bio: z.string().max(500).optional(),
    themeColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
        .optional(),
    themeMode: z.enum(['light', 'dark', 'system']).optional(),
});

// ─── TYPES ─────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
