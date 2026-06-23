# Sorsa MCP

An [MCP](https://modelcontextprotocol.io) server for the [Sorsa.io API v3](https://api.sorsa.io/v3/swagger.json) —
access to X/Twitter data: profiles, tweets, search, follow/retweet checks, Sorsa scores, lists and communities.

The server exposes **40 tools**, one per API endpoint.

## Installation

```bash
npm install
npm run build
```

Or, once published, run it with no install via `npx` (see below).

## Configuration

You need a Sorsa API key. It is read from the `SORSA_API_KEY` environment variable
and sent with every request in the `ApiKey` header.

| Variable          | Required | Default                      |
| ----------------- | -------- | ---------------------------- |
| `SORSA_API_KEY`   | yes      | —                            |
| `SORSA_BASE_URL`  | no       | `https://api.sorsa.io/v3`    |

## Connecting a client

### Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (per project).

Using the published npm package (nothing to install, `npx` fetches it):

```json
{
  "mcpServers": {
    "sorsa": {
      "command": "npx",
      "args": ["-y", "sorsa-mcp"],
      "env": {
        "SORSA_API_KEY": "YOUR_KEY"
      }
    }
  }
}
```

Or running from a locally built checkout:

```json
{
  "mcpServers": {
    "sorsa": {
      "command": "node",
      "args": ["D:\\Code\\Cursor Projects\\Sorsa_MCP\\dist\\index.js"],
      "env": {
        "SORSA_API_KEY": "YOUR_KEY"
      }
    }
  }
}
```

### Claude Desktop

Edit `%APPDATA%\Claude\claude_desktop_config.json` and add the same `mcpServers`
block as above, then restart the app.

## Local check

```bash
# build
npm run build

# run (communicates over stdio — easiest to test through a client)
SORSA_API_KEY=YOUR_KEY npm start
```

The quickest way to confirm your key works is the `get_key_usage_info` tool —
it returns your remaining request balance and the key's expiration date.

## Available tools

**Profiles:** `get_user_info`, `get_user_info_batch`, `get_followers`, `get_following`,
`get_verified_followers`, `get_account_about`

**Tweets:** `get_tweet_info`, `get_tweet_info_bulk`, `get_user_tweets`, `get_tweet_comments`,
`get_tweet_quotes`, `get_retweeters`, `get_article`, `get_trends`

**Search:** `search_tweets`, `search_users`, `search_mentions`, `get_space_info`

**Communities:** `get_community_members`, `get_community_tweets`, `search_community_tweets`

**Checks:** `check_follow`, `check_comment`, `check_quoted`, `check_retweet`,
`check_community_member`

**Sorsa metrics:** `get_sorsa_score`, `get_sorsa_score_changes`, `get_followers_stats`,
`get_top_followers`, `get_top_following`, `get_new_followers_7d`, `get_new_following_7d`

**Lists:** `get_list_members`, `get_list_tweets`, `get_list_followers`

**Utilities:** `username_to_id`, `id_to_username`, `link_to_id`, `get_key_usage_info`

## Project layout

- `src/endpoints.ts` — a declarative table of every endpoint (method, path, parameters).
  To add or change a tool, edit this file only.
- `src/index.ts` — the HTTP client plus tool registration driven by that table.

## How it works

Each endpoint is one entry in `ENDPOINTS`. Based on each field's `in`
(`path` / `query` / `body`), the handler routes arguments into the URL path, the
query string, or the JSON body, then sends the request to Sorsa with the `ApiKey`
header. The response is returned to the client as JSON text.

## License

MIT
