-- AlterTable: add location column to user_profiles (was in schema but missing from DB)
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "location" TEXT;
