import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
    // No R2 caching for now — add later with:
    // incrementalCache: (await import("@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache")).default
});
