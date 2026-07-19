/**
 * Thin client for Substack's public and internal (undocumented) APIs.
 *
 * Two tiers:
 *  - Public endpoints on your publication's domain (archive, posts, comments)
 *    work with no auth.
 *  - Private endpoints (drafts, your notes feed, subscriber-ish data) require
 *    a session cookie captured from a logged-in browser session. Substack has
 *    no official API, so these can break without notice.
 */

export interface SubstackConfig {
  /** Publication hostname, e.g. "example.substack.com" or a custom domain. */
  hostname: string;
  /**
   * Cookie header value from a logged-in substack.com session
   * (at minimum the `substack.sid` / `connect.sid` cookie).
   * Required only for private endpoints.
   */
  cookie?: string;
  /** Your numeric Substack user id, required for list_notes. */
  userId?: string;
}

export class SubstackError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SubstackError";
  }
}

export class SubstackClient {
  constructor(private readonly config: SubstackConfig) {}

  get hasAuth(): boolean {
    return Boolean(this.config.cookie);
  }

  private async request<T>(
    url: string,
    opts: { auth?: boolean } = {},
  ): Promise<T> {
    if (opts.auth && !this.config.cookie) {
      throw new SubstackError(
        "This endpoint requires authentication. Set SUBSTACK_COOKIE to your " +
          "session cookie (see README: 'Authenticated endpoints').",
      );
    }

    const headers: Record<string, string> = {
      accept: "application/json",
      "user-agent":
        "substack-mcp/0.1 (+https://github.com/bccody03; personal archive tool)",
    };
    if (this.config.cookie) {
      headers.cookie = this.config.cookie;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new SubstackError(
        `Substack returned ${res.status} for ${url}` +
          (res.status === 401 || res.status === 403
            ? " — your SUBSTACK_COOKIE may be missing, expired, or lack access."
            : "") +
          (body ? `\n${body.slice(0, 500)}` : ""),
        res.status,
      );
    }
    return (await res.json()) as T;
  }

  private pubUrl(path: string): string {
    return `https://${this.config.hostname}${path}`;
  }

  // ---------------------------------------------------------------- public

  /** Published posts from the archive, newest first. */
  listPosts(opts: { offset?: number; limit?: number; search?: string } = {}) {
    const params = new URLSearchParams({
      sort: "new",
      offset: String(opts.offset ?? 0),
      limit: String(Math.min(opts.limit ?? 20, 50)),
    });
    if (opts.search) params.set("search", opts.search);
    return this.request<ArchivePost[]>(
      this.pubUrl(`/api/v1/archive?${params}`),
    );
  }

  /** Full post (including body HTML) by slug. */
  getPost(slug: string) {
    return this.request<FullPost>(
      this.pubUrl(`/api/v1/posts/${encodeURIComponent(slug)}`),
    );
  }

  /** Comment tree for a post, by numeric post id. */
  listComments(postId: number) {
    return this.request<{ comments: SubstackComment[] }>(
      this.pubUrl(`/api/v1/post/${postId}/comments?all_comments=true`),
    );
  }

  /** Public profile for a Substack user handle. */
  getProfile(handle: string) {
    return this.request<PublicProfile>(
      `https://substack.com/api/v1/user/${encodeURIComponent(handle)}/public_profile`,
    );
  }

  // --------------------------------------------------------------- private

  /** Your unpublished drafts. Requires cookie + being an author on the pub. */
  listDrafts(opts: { offset?: number; limit?: number } = {}) {
    const params = new URLSearchParams({
      offset: String(opts.offset ?? 0),
      limit: String(Math.min(opts.limit ?? 20, 50)),
    });
    return this.request<DraftPost[]>(this.pubUrl(`/api/v1/drafts?${params}`), {
      auth: true,
    });
  }

  /**
   * Notes feed for a profile (yours by default, via SUBSTACK_USER_ID).
   * Cursor-paginated; pass the `nextCursor` from a previous page to continue.
   */
  listNotes(opts: { userId?: string; cursor?: string } = {}) {
    const userId = opts.userId ?? this.config.userId;
    if (!userId) {
      throw new SubstackError(
        "list_notes needs a user id. Set SUBSTACK_USER_ID (find it in the " +
          "response of get_profile for your own handle) or pass user_id.",
      );
    }
    const params = new URLSearchParams({ types: "note" });
    if (opts.cursor) params.set("cursor", opts.cursor);
    return this.request<NotesFeed>(
      `https://substack.com/api/v1/reader/feed/profile/${userId}?${params}`,
      { auth: true },
    );
  }
}

// ------------------------------------------------------------------- types
// Substack's responses are large and undocumented; these cover the fields we
// surface. Extra fields pass through untouched since we return raw JSON.

export interface ArchivePost {
  id: number;
  title: string;
  subtitle: string | null;
  slug: string;
  post_date: string;
  canonical_url: string;
  audience: string;
  type: string;
  description: string | null;
  truncated_body_text?: string;
  reactions?: Record<string, number>;
  comment_count?: number;
}

export interface FullPost extends ArchivePost {
  body_html: string;
}

export interface SubstackComment {
  id: number;
  body: string;
  date: string;
  name: string | null;
  user_id: number | null;
  children?: SubstackComment[];
}

export interface DraftPost {
  id: number;
  draft_title: string | null;
  draft_subtitle: string | null;
  draft_created_at: string;
  draft_updated_at: string;
  type: string;
}

export interface PublicProfile {
  id: number;
  name: string;
  handle: string;
  bio: string | null;
  subscriberCountString?: string;
}

export interface NotesFeed {
  items: unknown[];
  nextCursor?: string;
}
