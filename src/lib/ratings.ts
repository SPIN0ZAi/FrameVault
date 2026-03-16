import { prisma } from '@/lib/prisma';

let ensureHalfRatingsPromise: Promise<void> | null = null;

/**
 * Ensures rating columns can store half-step values (e.g. 8.5).
 * This is a safety net for environments where DB migrations may lag behind deploys.
 */
export function ensureHalfRatingColumns(): Promise<void> {
    if (!ensureHalfRatingsPromise) {
        ensureHalfRatingsPromise = (async () => {
            try {
                const rows = await prisma.$queryRaw<Array<{ table_name: string; data_type: string }>>`
                    SELECT table_name, data_type
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name IN ('ratings', 'show_ratings')
                      AND column_name = 'value'
                `;

                const byTable = new Map(rows.map(r => [r.table_name, r.data_type.toLowerCase()]));
                const isFloatType = (dt: string | undefined) => dt === 'double precision' || dt === 'real' || dt === 'numeric' || dt === 'decimal';

                if (!isFloatType(byTable.get('ratings'))) {
                    await prisma.$executeRawUnsafe(`
                        ALTER TABLE "ratings"
                        ALTER COLUMN "value" TYPE DOUBLE PRECISION
                        USING "value"::DOUBLE PRECISION
                    `);
                }

                if (!isFloatType(byTable.get('show_ratings'))) {
                    await prisma.$executeRawUnsafe(`
                        ALTER TABLE "show_ratings"
                        ALTER COLUMN "value" TYPE DOUBLE PRECISION
                        USING "value"::DOUBLE PRECISION
                    `);
                }
            } catch (error) {
                console.warn('ensureHalfRatingColumns skipped:', error);
            }
        })();
    }

    return ensureHalfRatingsPromise;
}
