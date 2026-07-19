#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SubstackClient, SubstackError } from "./substack.js";

const hostname = process.env.SUBSTACK_HOSTNAME;
if (!hostname) {
  console.error(
    "SUBSTACK_HOSTNAME is required (e.g. 'example.substack.com' or your custom domain).",
  );
  process.exit(1);
}

const client = new SubstackClient({
  hostname,
  cookie: process.env.SUBSTACK_COOKIE,
  userId: process.env.SUBSTACK_USER_ID,
});

const server = new McpServer({
  name: "substack",
  version: "0.1.0",
});

/** Wrap a handler so Substack/API errors come back as readable tool errors. */
function handle<A extends unknown[]>(
  fn: (...args: A) => Promise<unknown>,
): (...args: A) => Promise<{
  content: { type: "text"; text: string }[];
  isError?: boolean;
}> {
  return async (...args: A) => {
    try {
      const result = await fn(...args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const message =
        err instanceof SubstackError
          ? err.message
          : err instanceof Error
            ? `Unexpected error: ${err.message}`
            : String(err);
      return { content: [{ type: "text", text: message }], isError: true };
    }
  };
}

/** Crude but dependency-free HTML → text for post bodies. */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

server.registerTool(
  "list_posts",
  {
    title: "List published posts",
    description:
      "List published posts from the publication archive, newest first. " +
      "Supports pagination via offset/limit and full-text search.",
    inputSchema: {
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(20)
        .describe("Posts per page (max 50)"),
      search: z.string().optional().describe("Full-text search query"),
    },
  },
  handle(async ({ offset, limit, search }) => {
    const posts = await client.listPosts({ offset, limit, search });
    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      slug: p.slug,
      date: p.post_date,
      url: p.canonical_url,
      audience: p.audience,
      comment_count: p.comment_count,
      reactions: p.reactions,
      preview: p.truncated_body_text ?? p.description,
    }));
  }),
);

server.registerTool(
  "get_post",
  {
    title: "Get a post",
    description:
      "Fetch a full post by slug (the last path segment of its URL), " +
      "including the body as plain text or HTML.",
    inputSchema: {
      slug: z.string().describe("Post slug, e.g. 'my-first-post'"),
      format: z
        .enum(["text", "html"])
        .default("text")
        .describe("Body format: plain text (default) or raw HTML"),
    },
  },
  handle(async ({ slug, format }) => {
    const post = await client.getPost(slug);
    return {
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      date: post.post_date,
      url: post.canonical_url,
      audience: post.audience,
      body: format === "html" ? post.body_html : htmlToText(post.body_html),
    };
  }),
);

server.registerTool(
  "list_comments",
  {
    title: "List comments on a post",
    description:
      "Fetch the full comment tree for a post by its numeric id " +
      "(from list_posts or get_post).",
    inputSchema: {
      post_id: z.number().int().describe("Numeric post id"),
    },
  },
  handle(({ post_id }) => client.listComments(post_id)),
);

server.registerTool(
  "get_profile",
  {
    title: "Get a user profile",
    description:
      "Fetch a Substack user's public profile by handle. Useful for finding " +
      "your numeric user id (needed for list_notes).",
    inputSchema: {
      handle: z.string().describe("Substack handle, e.g. 'bccody'"),
    },
  },
  handle(({ handle }) => client.getProfile(handle)),
);

server.registerTool(
  "list_drafts",
  {
    title: "List drafts (auth required)",
    description:
      "List unpublished drafts on the publication. Requires SUBSTACK_COOKIE " +
      "and author access.",
    inputSchema: {
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(20)
        .describe("Drafts per page (max 50)"),
    },
  },
  handle(({ offset, limit }) => client.listDrafts({ offset, limit })),
);

server.registerTool(
  "list_notes",
  {
    title: "List notes (auth required)",
    description:
      "List Substack Notes from a profile feed (yours via SUBSTACK_USER_ID " +
      "by default). Requires SUBSTACK_COOKIE. Cursor-paginated: pass the " +
      "nextCursor from a previous call to fetch the next page.",
    inputSchema: {
      user_id: z
        .string()
        .optional()
        .describe("Numeric user id; defaults to SUBSTACK_USER_ID"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from a previous call"),
    },
  },
  handle(({ user_id, cursor }) => client.listNotes({ userId: user_id, cursor })),
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(
  `substack-mcp ready — publication: ${hostname}, auth: ${
    client.hasAuth ? "cookie set" : "public endpoints only"
  }`,
);
