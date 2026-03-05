import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
    const n = await p.reviewLike.count();
    console.log('TABLE OK, count:', n);
} catch (e) {
    console.log('TABLE MISSING:', e.message);
} finally {
    await p.$disconnect();
}
