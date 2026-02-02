/**
 * Canonical public URLs for sharing portfolios.
 *
 * In the preview environment, window.location.origin points at a preview domain.
 * For a SaaS, we usually want users to copy the published domain so links work
 * when pasted into resumes.
 *
 * If you later add a custom domain, update DEFAULT_PUBLISHED_ORIGIN.
 */

const DEFAULT_PUBLISHED_ORIGIN = "https://folioai.lovable.app";

export function getPublicAppOrigin(): string {
  if (typeof window === "undefined") return DEFAULT_PUBLISHED_ORIGIN;

  const host = window.location.hostname;

  // Lovable preview domains look like: id-preview--<uuid>.lovable.app
  // When we're on preview, return the published origin for share links.
  if (host.startsWith("id-preview--") && host.endsWith(".lovable.app")) {
    return DEFAULT_PUBLISHED_ORIGIN;
  }

  return window.location.origin;
}

export function getPublicPortfolioUrl(username: string): string {
  return `${getPublicAppOrigin()}/p/${username}`;
}

export function getPublicLinkUrl(slug: string): string {
  return `${getPublicAppOrigin()}/link/${slug}`;
}
