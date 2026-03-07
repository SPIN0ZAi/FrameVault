-- AlterTable: add image position fields to user_profiles
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "bannerPosition" TEXT DEFAULT '50% 50%';
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "avatarPosition" TEXT DEFAULT '50% 50%';
