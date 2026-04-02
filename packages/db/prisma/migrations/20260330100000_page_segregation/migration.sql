-- ============================================================================
-- Migration: Page/Account Segregation
-- Description: Move from "filter by pageId" to proper page/account segregation.
--              Every piece of data belongs to a specific Page.
-- ============================================================================

-- 1. Create Page table
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformPageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pictureUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Page_orgId_idx" ON "Page"("orgId");
CREATE INDEX "Page_connectionId_idx" ON "Page"("connectionId");
CREATE UNIQUE INDEX "Page_orgId_platform_platformPageId_key" ON "Page"("orgId", "platform", "platformPageId");

ALTER TABLE "Page" ADD CONSTRAINT "Page_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Page" ADD CONSTRAINT "Page_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "PlatformConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Migrate existing Post.pageId data
--    Before making pageId required, we need a Page row for every distinct pageId.
--    IMPORTANT: Run the data migration script BEFORE this step if you have existing posts.
--    This ALTER will fail if there are Posts with NULL pageId. Backfill them first.

-- Make Post.pageId required (NOT NULL) and add FK to Page
-- Step 2a: Add the FK constraint (pageId column already exists)
ALTER TABLE "Post" ALTER COLUMN "pageId" SET NOT NULL;
CREATE INDEX "Post_pageId_idx" ON "Post"("pageId");
ALTER TABLE "Post" ADD CONSTRAINT "Post_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Add pageId to Campaign (optional)
ALTER TABLE "Campaign" ADD COLUMN "pageId" TEXT;
CREATE INDEX "Campaign_pageId_idx" ON "Campaign"("pageId");
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Create BrandVoice table
CREATE TABLE "BrandVoice" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sampleTexts" TEXT[],
    "aiPrompt" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandVoice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BrandVoice_pageId_idx" ON "BrandVoice"("pageId");
ALTER TABLE "BrandVoice" ADD CONSTRAINT "BrandVoice_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Create HashtagSet table
CREATE TABLE "HashtagSet" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashtags" TEXT[],
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HashtagSet_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HashtagSet_pageId_idx" ON "HashtagSet"("pageId");
ALTER TABLE "HashtagSet" ADD CONSTRAINT "HashtagSet_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Create ContentTemplate table
CREATE TABLE "ContentTemplate" (
    "id" TEXT NOT NULL,
    "pageId" TEXT,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform",
    "contentBody" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentTemplate_orgId_idx" ON "ContentTemplate"("orgId");
CREATE INDEX "ContentTemplate_pageId_idx" ON "ContentTemplate"("pageId");
ALTER TABLE "ContentTemplate" ADD CONSTRAINT "ContentTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentTemplate" ADD CONSTRAINT "ContentTemplate_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Create ApprovalRequest table
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApprovalRequest_postId_key" ON "ApprovalRequest"("postId");
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Create RssFeed table
CREATE TABLE "RssFeed" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "checkInterval" INTEGER NOT NULL DEFAULT 3600,
    "lastCheckedAt" TIMESTAMP(3),
    "lastItemGuid" TEXT,
    "autoPost" BOOLEAN NOT NULL DEFAULT false,
    "tone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RssFeed_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RssFeed_pageId_idx" ON "RssFeed"("pageId");
ALTER TABLE "RssFeed" ADD CONSTRAINT "RssFeed_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. Create WebhookRule table
CREATE TABLE "WebhookRule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "pageId" TEXT,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebhookRule_orgId_idx" ON "WebhookRule"("orgId");
ALTER TABLE "WebhookRule" ADD CONSTRAINT "WebhookRule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebhookRule" ADD CONSTRAINT "WebhookRule_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 10. Create LeadCapture table
CREATE TABLE "LeadCapture" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "pageId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadCapture_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeadCapture_orgId_idx" ON "LeadCapture"("orgId");
CREATE INDEX "LeadCapture_pageId_idx" ON "LeadCapture"("pageId");
ALTER TABLE "LeadCapture" ADD CONSTRAINT "LeadCapture_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadCapture" ADD CONSTRAINT "LeadCapture_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 11. Create UtmLink table
CREATE TABLE "UtmLink" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "postId" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "term" TEXT,
    "content" TEXT,
    "shortUrl" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UtmLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UtmLink_shortUrl_key" ON "UtmLink"("shortUrl");
CREATE INDEX "UtmLink_orgId_idx" ON "UtmLink"("orgId");
CREATE INDEX "UtmLink_postId_idx" ON "UtmLink"("postId");
ALTER TABLE "UtmLink" ADD CONSTRAINT "UtmLink_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UtmLink" ADD CONSTRAINT "UtmLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 12. Create PerformanceReport table
CREATE TABLE "PerformanceReport" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "pageId" TEXT,
    "reportType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "sentTo" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PerformanceReport_orgId_idx" ON "PerformanceReport"("orgId");
ALTER TABLE "PerformanceReport" ADD CONSTRAINT "PerformanceReport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerformanceReport" ADD CONSTRAINT "PerformanceReport_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
