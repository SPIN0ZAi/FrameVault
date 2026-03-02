const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findUnique({
            where: { username: 'Admin' },
            select: {
                id: true,
                _count: {
                    select: {
                        followers: true,
                        following: true
                    }
                }
            }
        });
        console.log("Success:", user);
    } catch (e) {
        console.error("Prisma Error:\n", e.message || e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
