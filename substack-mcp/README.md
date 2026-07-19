# substack-mcp

An MCP server for pulling your Substack content — published posts, comments,
Notes, and drafts — into Claude or any other MCP client.

Substack has **no official public API**, so this server works in two tiers:

| Tier | Tools | Auth |
|------|-------|------|
| Public | `list_posts`, `get_post`, `list_comments`, `get_profile` | none |
| Private | `list_drafts`, `list_notes` | session cookie |

The private tier uses Substack's internal web-app endpoints (the same ones
their site uses). They are undocumented and can change without notice.

## Setup

```bash
cd substack-mcp
npm install
npm run build
```

## Configuration

Environment variables:

| Variable | Required | Example |
|----------|----------|---------|
| `SUBSTACK_HOSTNAME` | yes | `example.substack.com` (or your custom domain) |
| `SUBSTACK_COOKIE` | for private tools | `substack.sid=s%3A...` |
| `SUBSTACK_USER_ID` | for `list_notes` | `12345678` |

### Authenticated endpoints

To use `list_drafts` and `list_notes`:

1. Log in to substack.com in your browser.
2. Open DevTools → Application (Chrome) or Storage (Firefox) → Cookies →
   `https://substack.com`.
3. Copy the `substack.sid` cookie value and set
   `SUBSTACK_COOKIE="substack.sid=<value>"`.
4. For your user id, call the `get_profile` tool with your handle — the `id`
   field in the response is your `SUBSTACK_USER_ID`.

Treat the cookie like a password: it grants full access to your Substack
account. Don't commit it anywhere; session cookies also expire, so expect to
refresh it occasionally.

## Registering with Claude Code

macOS/Linux:

```bash
claude mcp add substack \
  --env SUBSTACK_HOSTNAME=example.substack.com \
  --env SUBSTACK_COOKIE="substack.sid=..." \
  --env SUBSTACK_USER_ID=12345678 \
  -- node /path/to/substack-mcp/dist/index.js
```

Windows (PowerShell — note the backtick line continuations and Windows path):

```powershell
claude mcp add substack `
  --env SUBSTACK_HOSTNAME=example.substack.com `
  --env SUBSTACK_COOKIE="substack.sid=..." `
  --env SUBSTACK_USER_ID=12345678 `
  -- node C:\path\to\substack-mcp\dist\index.js
```

Or in a `.mcp.json` / Claude Desktop config (on Windows, use double
backslashes in the path, e.g. `"C:\\path\\to\\substack-mcp\\dist\\index.js"`):

```json
{
  "mcpServers": {
    "substack": {
      "command": "node",
      "args": ["/path/to/substack-mcp/dist/index.js"],
      "env": {
        "SUBSTACK_HOSTNAME": "example.substack.com",
        "SUBSTACK_COOKIE": "substack.sid=...",
        "SUBSTACK_USER_ID": "12345678"
      }
    }
  }
}
```

## Tools

- **`list_posts`** — published posts from the archive, newest first, with
  pagination (`offset`, `limit`) and full-text `search`.
- **`get_post`** — one post by slug, body as plain text (default) or HTML.
- **`list_comments`** — full comment tree for a post by numeric id.
- **`get_profile`** — public profile for any handle (also how you find your
  numeric user id).
- **`list_drafts`** — unpublished drafts (cookie + author access required).
- **`list_notes`** — Substack Notes from a profile feed, cursor-paginated
  (cookie required).

## Caveats

- Private endpoints are reverse-engineered and may break when Substack
  changes their internals.
- `list_notes` reads the reader feed for a profile; very old notes may
  require many pages of cursor pagination.
- Paywalled post bodies are only returned in full if your cookie has access.
