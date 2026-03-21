-- Add optional display name for public profile presentation
ALTER TABLE "user_profiles"
    ADD COLUMN "displayName" TEXT;
