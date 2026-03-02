import { NextResponse } from 'next/server';

interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>[];
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>) {
    return NextResponse.json({
        success: true,
        data,
        ...(meta ? { meta } : {}),
    });
}

export function errorResponse(
    error: ApiError,
    status: number = 400
) {
    return NextResponse.json(
        {
            success: false,
            error,
        },
        { status }
    );
}

export function validationError(message: string, details?: Record<string, unknown>[]) {
    return errorResponse(
        { code: 'VALIDATION_ERROR', message, details },
        400
    );
}

export function unauthorizedError(message = 'You must be logged in') {
    return errorResponse(
        { code: 'UNAUTHORIZED', message },
        401
    );
}

export function forbiddenError(message = 'You do not have permission') {
    return errorResponse(
        { code: 'FORBIDDEN', message },
        403
    );
}

export function notFoundError(resource = 'Resource') {
    return errorResponse(
        { code: 'NOT_FOUND', message: `${resource} not found` },
        404
    );
}

export function serverError(message = 'An unexpected error occurred') {
    return errorResponse(
        { code: 'SERVER_ERROR', message },
        500
    );
}
