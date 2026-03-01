// In-memory voice prefetch cache
// Keys: `${npcId}:${dialogue}`, Values: Promise<string | null> (base64 audio)

const cache = new Map<string, Promise<string | null>>();

function cacheKey(dialogue: string, npcId: string): string {
  return `${npcId}:${dialogue}`;
}

/** Fire-and-forget prefetch — stores the fetch Promise so consumers can await it later */
export function prefetchVoice(dialogue: string, npcId: string): void {
  const key = cacheKey(dialogue, npcId);
  if (cache.has(key)) return; // already in-flight or resolved

  const promise = fetch("/api/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dialogue, npcId }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => (data?.audio as string) ?? null)
    .catch(() => null);

  cache.set(key, promise);
}

/** Returns the cached Promise (may still be in-flight) or null if not prefetched */
export function getCachedVoice(dialogue: string, npcId: string): Promise<string | null> | null {
  return cache.get(cacheKey(dialogue, npcId)) ?? null;
}

/** Clear the entire cache (on scene dismiss / game reset) */
export function clearVoiceCache(): void {
  cache.clear();
}
