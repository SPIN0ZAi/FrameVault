# Quick Rate for Shows (Hover Poster → ⭐ Popup)

## Plan Overview
1. ✅ Create `src/components/ui/ShowHoverCard.tsx` (adapt MovieHoverCard + quick rating)
2. ✅ Create `src/app/api/shows/[id]/preview/route.ts` (TMDB show preview data)
3. ✅ Update `src/app/shows/page.tsx` (replace ShowCard → ShowHoverCard)

## ✅ COMPLETE

Quick Rate implemented:
- Hover any show poster → preview panel appears (220ms delay)
- Logged-in users see "Quick Rate" with interactive 1-10 half-stars ⭐
- Click/hover stars → instant optimistic update + API call to `/api/shows/[id]/rating`
- Feedback toast ("8.5/10", "Rating removed")
- Works alongside existing watched/watchlist buttons
- Preview API cached, matches MovieHoverCard style

Files changed:
- ✅ `src/components/ui/ShowHoverCard.tsx` (new)
- ✅ `src/app/api/shows/[id]/preview/route.ts` (new) 
- ✅ `src/app/shows/page.tsx` (ShowCard → ShowHoverCard)
- ✅ TODO.md (tracked)

Test: Navigate to `/shows`, hover posters, rate shows. Friction removed! 🚀
