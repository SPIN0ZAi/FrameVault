import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        tmdbKeyLength: process.env.TMDB_API_KEY?.length || 0,
        authSecretLength: process.env.AUTH_SECRET?.length || 0,
        hasKey: !!process.env.TMDB_API_KEY,
    });
}
