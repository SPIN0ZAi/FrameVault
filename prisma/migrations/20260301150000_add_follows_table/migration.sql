-- CreateTable: follows (was in schema but missing from the initial migration)
CREATE TABLE IF NOT EXISTS "follows" (
    "followerId"  TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("followerId", "followingId")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "follows_followerId_idx" ON "follows"("followerId");
CREATE INDEX IF NOT EXISTS "follows_followingId_idx" ON "follows"("followingId");

-- AddForeignKey
ALTER TABLE "follows"
    ADD CONSTRAINT "follows_followerId_fkey"
    FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "follows"
    ADD CONSTRAINT "follows_followingId_fkey"
    FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
