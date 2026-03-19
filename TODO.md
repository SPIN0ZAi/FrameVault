# Continue Watching / Resume Context UX Improvements

## Plan Overview
**Goal**: When users navigate away from and return to movie/show detail pages, restore:
1. Scroll position 
2. Active section visibility (via scroll)

**Files**: `src/app/movies/[id]/page.tsx` & `src/app/shows/[id]/page.tsx`

## Steps ⬜️

### 1. ✅ Create this TODO.md

### 2. ✅ Implement scroll restoration in movies/[id]/page.tsx
- Add `useRef` for scroll container
- Save scroll position to localStorage (per-user key: `movie-scroll-${userId}-${movieId}`)
- Restore scroll position on mount
- Debounced save (throttled to ~100ms)

### 3. ✅ Implement scroll restoration in shows/[id]/page.tsx  
- Same pattern as movies
- Key: `show-scroll-${userId}-${showId}`

### 4. Test UX flow
```
1. User scrolls to "Cast" section on movie page
2. Navigate away (back/home/other page)
3. Return to same movie page  
4. Should auto-scroll to Cast section
5. Test across sessions/browser restart
```

### 5. Clean up
- Update TODO.md ✅
- attempt_completion

## Notes
- Uses `session?.user?.id` for per-user storage
- Fallback for anon users
- No backend changes needed
- Pure client-side UX improvement
