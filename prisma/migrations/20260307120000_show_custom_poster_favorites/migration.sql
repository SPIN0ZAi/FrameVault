-- CreateTable
CREATE TABLE "show_custom_posters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdbShowId" INTEGER NOT NULL,
    "posterUrl" TEXT NOT NULL,

    CONSTRAINT "show_custom_posters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_show_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tmdb_show_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "poster_url" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_show_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "show_custom_posters_userId_tmdbShowId_key" ON "show_custom_posters"("userId", "tmdbShowId");

-- CreateIndex
CREATE UNIQUE INDEX "user_show_favorites_user_id_tmdb_show_id_key" ON "user_show_favorites"("user_id", "tmdb_show_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_show_favorites_user_id_position_key" ON "user_show_favorites"("user_id", "position");

-- CreateIndex
CREATE INDEX "user_show_favorites_user_id_idx" ON "user_show_favorites"("user_id");

-- AddForeignKey
ALTER TABLE "show_custom_posters" ADD CONSTRAINT "show_custom_posters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_show_favorites" ADD CONSTRAINT "user_show_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
