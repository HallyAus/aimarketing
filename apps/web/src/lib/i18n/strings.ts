/**
 * Centralized UI Strings
 *
 * This file contains common UI labels, messages, and status text used across
 * AdPilot. It serves as a lightweight precursor to a full i18n solution.
 *
 * Convention: keys follow the pattern `section.element` for easy future
 * migration to next-intl or i18next JSON message files.
 *
 * All values are US English. When localization is added, this file will be
 * replaced by locale-specific JSON files (messages/en.json, messages/es.json).
 */

// ---------------------------------------------------------------------------
// Common actions
// ---------------------------------------------------------------------------

export const ACTIONS = {
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  create: "Create",
  confirm: "Confirm",
  back: "Back",
  next: "Next",
  submit: "Submit",
  retry: "Retry",
  close: "Close",
  search: "Search",
  filter: "Filter",
  refresh: "Refresh",
  connect: "Connect",
  disconnect: "Disconnect",
  reconnect: "Reconnect",
  manageConnections: "Manage connections",
  connectAccounts: "Connect accounts",
  viewAll: "View all",
  learnMore: "Learn more",
  upgrade: "Upgrade",
  signOut: "Sign out",
} as const;

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export const NAV = {
  home: "Home",
  dashboard: "Dashboard",
  campaigns: "Campaigns",
  posts: "Posts",
  analytics: "Analytics",
  settings: "Settings",
  connections: "Connections",
  team: "Team",
  billing: "Billing",
} as const;

// ---------------------------------------------------------------------------
// Connection / token status
// ---------------------------------------------------------------------------

export const CONNECTION_STATUS = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
} as const;

export const TOKEN_HEALTH = {
  HEALTHY: "Connected",
  EXPIRING_SOON: "Expiring soon",
  EXPIRED: "Expired",
  REFRESH_FAILED: "Refresh failed",
  REVOKED: "Revoked",
  UNKNOWN: "Unknown",
} as const;

export const TOKEN_MESSAGES = {
  expiringSoon: (platform: string) =>
    `Your ${platform} connection is expiring soon. It will be refreshed automatically.`,
  expired: (platform: string) =>
    `Your ${platform} connection has expired. Please reconnect to continue posting.`,
  revoked: (platform: string) =>
    `Your ${platform} connection was revoked. Please reconnect.`,
  refreshFailed: (platform: string) =>
    `Unable to refresh your ${platform} connection. Please reconnect.`,
} as const;

// ---------------------------------------------------------------------------
// Post status
// ---------------------------------------------------------------------------

export const POST_STATUS = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  PUBLISHING: "Publishing",
  PUBLISHED: "Published",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
} as const;

// ---------------------------------------------------------------------------
// Campaign status
// ---------------------------------------------------------------------------

export const CAMPAIGN_STATUS = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
} as const;

// ---------------------------------------------------------------------------
// Platform display names
// ---------------------------------------------------------------------------

export const PLATFORM_NAMES: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
  TWITTER_X: "Twitter/X",
  YOUTUBE: "YouTube",
  GOOGLE_ADS: "Google Ads",
  PINTEREST: "Pinterest",
  SNAPCHAT: "Snapchat",
} as const;

// ---------------------------------------------------------------------------
// Error messages
// ---------------------------------------------------------------------------

export const ERRORS = {
  generic: "Something went wrong. Please try again.",
  networkError: "Unable to reach the server. Check your connection and try again.",
  unauthorized: "You are not authorized to perform this action.",
  notFound: "The requested resource was not found.",
  rateLimited: "Too many requests. Please wait a moment and try again.",
  sessionExpired: "Your session has expired. Please sign in again.",
  fileTooLarge: "The file is too large. Maximum size is {maxSize}.",
  invalidFormat: "Invalid file format. Accepted formats: {formats}.",
} as const;

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

export const EMPTY_STATES = {
  noPosts: "No posts yet. Create your first post to get started.",
  noCampaigns: "No campaigns yet. Create a campaign to organize your posts.",
  noConnections: "No platforms connected. Connect an account to start posting.",
  noAnalytics: "No analytics data available yet. Publish some posts first.",
  noTeamMembers: "No team members. Invite people to collaborate.",
} as const;

// ---------------------------------------------------------------------------
// Confirmation dialogs
// ---------------------------------------------------------------------------

export const CONFIRMATIONS = {
  deletePost: "Are you sure you want to delete this post? This action cannot be undone.",
  deleteCampaign: "Are you sure you want to delete this campaign? All associated posts will be unlinked.",
  disconnectPlatform: (platform: string) =>
    `Disconnect ${platform}? Scheduled posts for this platform will be cancelled.`,
  removeTeamMember: (name: string) =>
    `Remove ${name} from the team? They will lose access to this organization.`,
} as const;
