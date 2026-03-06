import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkAndAwardAchievements } from '@/lib/achievements';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';

// The 2026 Oscar Best Picture nominees (98th Academy Awards — March 2, 2026 ceremony)
const NOMINEES_2026 = [
    { title: 'Bugonia', year: 2025 },
    { title: 'F1', year: 2025 },
    { title: 'Frankenstein', year: 2025 },
    { title: 'Hamnet', year: 2025 },
    { title: 'Marty Supreme', year: 2025 },
    { title: 'One Battle after Another', year: 2025 },
    { title: 'The Secret Agent', year: 2025 },
    { title: 'Sentimental Value', year: 2025 },
    { title: 'Sinners', year: 2025 },
    { title: 'Train Dreams', year: 2025 },
];

async function getOrCreatePoll(year: number) {
    let poll = await prisma.oscarPoll.findUnique({ where: { year } });
    if (!poll) {
        poll = await prisma.oscarPoll.create({
            data: {
                year,
                nominees: NOMINEES_2026,
                isOpen: true,
            },
        });
    }
    return poll;
}

// GET /api/votes — get current year's poll + user's vote + results
export async function GET() {
    try {
        const session = await auth();
        const year = new Date().getFullYear();

        const poll = await getOrCreatePoll(year);

        // Get vote results (counts per movie)
        const votes = await prisma.oscarVote.findMany({
            where: { pollId: poll.id },
            select: { movieTitle: true },
        });

        const resultsMap: Record<string, number> = {};
        for (const v of votes) {
            resultsMap[v.movieTitle] = (resultsMap[v.movieTitle] ?? 0) + 1;
        }

        const nominees = poll.nominees as { title: string; year: number }[];
        const results = nominees.map(n => ({
            movieTitle: n.title,
            votes: resultsMap[n.title] ?? 0,
        })).sort((a, b) => b.votes - a.votes);

        const totalVotes = votes.length;

        // Get logged-in user's vote
        let userVote: { movieTitle: string } | null = null;
        if (session?.user?.id) {
            const v = await prisma.oscarVote.findUnique({
                where: { userId_pollId: { userId: session.user.id, pollId: poll.id } },
            });
            if (v) userVote = { movieTitle: v.movieTitle };
        }

        return successResponse({
            poll: {
                id: poll.id,
                year: poll.year,
                nominees,
                isOpen: poll.isOpen,
            },
            userVote,
            results: userVote ? results.map(r => ({ ...r, pct: totalVotes > 0 ? Math.round((r.votes / totalVotes) * 100) : 0 })) : null,
            totalVotes,
        });
    } catch (error) {
        console.error('GET /api/votes error:', error);
        return serverError();
    }
}

// POST /api/votes — cast a vote
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { movieTitle } = await req.json();
        if (!movieTitle || typeof movieTitle !== 'string') {
            return NextResponse.json({ success: false, error: { message: 'movieTitle is required' } }, { status: 400 });
        }

        const year = new Date().getFullYear();
        const poll = await getOrCreatePoll(year);

        if (!poll.isOpen) {
            return NextResponse.json({ success: false, error: { message: 'This poll is closed' } }, { status: 400 });
        }

        // Validate that the movie is a nominee
        const nominees = poll.nominees as { title: string; year: number }[];
        if (!nominees.some(n => n.title === movieTitle)) {
            return NextResponse.json({ success: false, error: { message: 'Invalid nominee' } }, { status: 400 });
        }

        // Upsert vote (user can change their vote)
        await prisma.oscarVote.upsert({
            where: { userId_pollId: { userId: session.user.id, pollId: poll.id } },
            create: { userId: session.user.id, pollId: poll.id, movieTitle },
            update: { movieTitle },
        });

        // Award achievement (fire-and-forget)
        checkAndAwardAchievements(session.user.id).catch(() => null);

        // Return fresh results
        const allVotes = await prisma.oscarVote.findMany({
            where: { pollId: poll.id },
            select: { movieTitle: true },
        });
        const totalVotes = allVotes.length;
        const resultsMap: Record<string, number> = {};
        for (const v of allVotes) {
            resultsMap[v.movieTitle] = (resultsMap[v.movieTitle] ?? 0) + 1;
        }
        const results = nominees.map(n => ({
            movieTitle: n.title,
            votes: resultsMap[n.title] ?? 0,
            pct: totalVotes > 0 ? Math.round(((resultsMap[n.title] ?? 0) / totalVotes) * 100) : 0,
        })).sort((a, b) => b.votes - a.votes);

        return successResponse({ movieTitle, results, totalVotes });
    } catch (error) {
        console.error('POST /api/votes error:', error);
        return serverError();
    }
}
