import { prisma } from "@/lib/db";

/**
 * Generic cache-through helper for PlatformConnection metadata.
 *
 * Checks `metadata[cacheKey]` and `metadata[cacheKey + "CachedAt"]`.
 * If the cached value exists and is younger than `maxAgeMs`, returns it.
 * Otherwise calls `fetcher`, stores the result in metadata, and returns it.
 */
export async function getCachedOrFetch<T>(
  connectionId: string,
  cacheKey: string,
  maxAgeMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const connection = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
    select: { metadata: true },
  });

  const metadata = (connection?.metadata as Record<string, unknown>) ?? {};
  const cachedAtKey = `${cacheKey}CachedAt`;
  const cached = metadata[cacheKey] as T | undefined;
  const cachedAt = metadata[cachedAtKey] as string | undefined;

  if (cached !== undefined && cachedAt) {
    const age = Date.now() - new Date(cachedAt).getTime();
    if (age < maxAgeMs) {
      return cached;
    }
  }

  // Cache miss or stale — fetch fresh data
  const freshData = await fetcher();

  const updatedMetadata = {
    ...metadata,
    [cacheKey]: freshData,
    [cachedAtKey]: new Date().toISOString(),
  } as Record<string, unknown>;

  await prisma.platformConnection.update({
    where: { id: connectionId },
    data: {
      metadata: updatedMetadata as Parameters<typeof prisma.platformConnection.update>[0]["data"]["metadata"],
    },
  });

  return freshData;
}
