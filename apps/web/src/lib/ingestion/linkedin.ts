import type {
  IngestionPage,
  IngestionJobRecord,
  IngestionResult,
} from "./types";

/**
 * LinkedIn historical ingestion — DISABLED for compliance.
 *
 * LinkedIn Marketing API restricts storing member social activity data
 * beyond 48 hours and member profile data beyond 24 hours.
 * Historical ingestion is disabled to comply with these requirements.
 *
 * @see https://learn.microsoft.com/en-us/linkedin/marketing/restricted-use-cases
 */
export async function ingestLinkedIn(
  _page: IngestionPage,
  _job: IngestionJobRecord,
  _accessToken: string,
): Promise<IngestionResult> {
  return {
    processedItems: 0,
    failedItems: 0,
    cursor: null,
    hasMore: false,
    oldestPostDate: null,
    rateLimited: false,
  };
}
