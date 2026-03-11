-- Add media_type column to list_movies
ALTER TABLE "list_movies" ADD COLUMN IF NOT EXISTS "media_type" TEXT NOT NULL DEFAULT 'movie';

-- Drop old unique constraint and add new one including media_type
ALTER TABLE "list_movies" DROP CONSTRAINT IF EXISTS "list_movies_list_id_tmdb_id_key";
ALTER TABLE "list_movies" ADD CONSTRAINT "list_movies_list_id_tmdb_id_media_type_key" UNIQUE ("list_id", "tmdb_id", "media_type");

-- Create show_reviews table
CREATE TABLE IF NOT EXISTS "show_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdb_show_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "contains_spoilers" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "show_reviews_pkey" PRIMARY KEY ("id")
);

-- Create show_review_likes table
CREATE TABLE IF NOT EXISTS "show_review_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "show_review_likes_pkey" PRIMARY KEY ("id")
);

-- Add indexes and constraints for show_reviews
ALTER TABLE "show_reviews" ADD CONSTRAINT "show_reviews_userId_tmdb_show_id_key" UNIQUE ("userId", "tmdb_show_id");
CREATE INDEX IF NOT EXISTS "show_reviews_tmdb_show_id_idx" ON "show_reviews"("tmdb_show_id");
ALTER TABLE "show_reviews" ADD CONSTRAINT "show_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes and constraints for show_review_likes
ALTER TABLE "show_review_likes" ADD CONSTRAINT "show_review_likes_userId_reviewId_key" UNIQUE ("userId", "reviewId");
CREATE INDEX IF NOT EXISTS "show_review_likes_reviewId_idx" ON "show_review_likes"("reviewId");
ALTER TABLE "show_review_likes" ADD CONSTRAINT "show_review_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "show_review_likes" ADD CONSTRAINT "show_review_likes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "show_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
