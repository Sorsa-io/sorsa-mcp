// Declarative description of every Sorsa.io v3 endpoint.
// Each entry becomes one MCP tool. The handler in index.ts reads `in`
// to route every field to the path, query string, or JSON body.

export type FieldType = "string" | "integer" | "number" | "boolean" | "array";

export interface Field {
  in: "path" | "query" | "body";
  type: FieldType;
  required?: boolean;
  enum?: string[];
  desc: string;
}

export interface Endpoint {
  name: string; // MCP tool name
  method: "GET" | "POST";
  path: string; // may contain {placeholders} for path params
  description: string;
  params: Record<string, Field>;
}

// Most "look up an account" endpoints accept any one of these three.
const userQuery = (): Record<string, Field> => ({
  username: { in: "query", type: "string", desc: "X/Twitter handle without the @ (provide one of username / user_id / user_link)." },
  user_id: { in: "query", type: "string", desc: "Numeric X/Twitter user ID." },
  user_link: { in: "query", type: "string", desc: "Full URL of the X/Twitter profile." },
});

const userBody = (): Record<string, Field> => ({
  username: { in: "body", type: "string", desc: "X/Twitter handle without the @ (provide one of username / user_id / user_link)." },
  user_id: { in: "body", type: "string", desc: "Numeric X/Twitter user ID." },
  user_link: { in: "body", type: "string", desc: "Full URL of the X/Twitter profile." },
});

export const ENDPOINTS: Endpoint[] = [
  // ---- Users data ----
  {
    name: "get_user_info",
    method: "GET",
    path: "/info",
    description: "Get the public profile of an X/Twitter account: display name, bio, follower/following counts, tweet count, verification, etc.",
    params: userQuery(),
  },
  {
    name: "get_user_info_batch",
    method: "GET",
    path: "/info-batch",
    description: "Get public profiles for multiple X/Twitter accounts in one request. Provide a list of usernames and/or user_ids.",
    params: {
      usernames: { in: "query", type: "array", desc: "Array of X/Twitter handles (without @)." },
      user_ids: { in: "query", type: "array", desc: "Array of numeric X/Twitter user IDs." },
    },
  },
  {
    name: "get_followers",
    method: "GET",
    path: "/followers",
    description: "List accounts that follow the given user (up to 200 profiles per page). Use next_cursor to paginate.",
    params: {
      ...userQuery(),
      next_cursor: { in: "query", type: "integer", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_following",
    method: "GET",
    path: "/follows",
    description: "List accounts that the given user follows (up to 200 profiles per page). Use next_cursor to paginate.",
    params: {
      ...userQuery(),
      next_cursor: { in: "query", type: "integer", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_verified_followers",
    method: "GET",
    path: "/verified-followers",
    description: "List verified accounts that follow the given user. Use next_cursor to paginate.",
    params: {
      ...userQuery(),
      next_cursor: { in: "query", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_account_about",
    method: "GET",
    path: "/about",
    description: 'Get metadata from an account\'s "About" section: country, total number of username changes, account creation info.',
    params: userQuery(),
  },

  // ---- Tweets ----
  {
    name: "get_tweet_info",
    method: "POST",
    path: "/tweet-info",
    description: "Get full data for a single tweet: text, date, language, engagement metrics, author and media.",
    params: {
      tweet_link: { in: "body", type: "string", required: true, desc: "Full tweet URL (e.g. https://x.com/user/status/123) or just the tweet ID." },
    },
  },
  {
    name: "get_tweet_info_bulk",
    method: "POST",
    path: "/tweet-info-bulk",
    description: "Get full data for up to 100 tweets in a single request.",
    params: {
      tweet_links: { in: "body", type: "array", required: true, desc: "Array of tweet URLs or tweet IDs (up to 100)." },
    },
  },
  {
    name: "get_user_tweets",
    method: "POST",
    path: "/user-tweets",
    description: "Get a paginated feed of tweets posted by a user (up to 20 per page).",
    params: {
      ...userBody(),
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_tweet_comments",
    method: "POST",
    path: "/comments",
    description: "Get a paginated list of replies (comments) under a tweet (up to 20 per page).",
    params: {
      tweet_link: { in: "body", type: "string", desc: "Full tweet URL or tweet ID." },
      order_by: { in: "body", type: "string", enum: ["Relevance", "Recency", "Likes"], desc: "Sort order. Defaults to Relevance." },
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_tweet_quotes",
    method: "POST",
    path: "/quotes",
    description: "Get a paginated list of tweets that quoted the given tweet (up to 20 per page).",
    params: {
      tweet_link: { in: "body", type: "string", desc: "Full tweet URL or tweet ID." },
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_retweeters",
    method: "POST",
    path: "/retweeters",
    description: "Get a paginated list of users who retweeted the given tweet (newest first).",
    params: {
      tweet_link: { in: "body", type: "string", desc: "Full tweet URL or tweet ID." },
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_article",
    method: "POST",
    path: "/article",
    description: "Get full data for an X/Twitter Article (long-form post): complete text, title, author and metadata.",
    params: {
      tweet_link: { in: "body", type: "string", desc: "Full URL of the article/tweet or just the tweet ID." },
    },
  },
  {
    name: "get_trends",
    method: "GET",
    path: "/trends",
    description: "Get trending topics for a location identified by its WOEID.",
    params: {
      woeid: { in: "query", type: "integer", required: true, desc: "WOEID (Where On Earth IDentifier) of the location." },
    },
  },

  // ---- Search ----
  {
    name: "search_tweets",
    method: "POST",
    path: "/search-tweets",
    description: "Search tweets using X/Twitter Advanced Search syntax (operators like from:, since:, min_faves:, etc.).",
    params: {
      query: { in: "body", type: "string", desc: "Search query / advanced-search expression." },
      order: { in: "body", type: "string", desc: "Sort order, e.g. 'popular' or 'latest'." },
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "search_users",
    method: "POST",
    path: "/search-users",
    description: "Search X/Twitter accounts by keyword or phrase.",
    params: {
      query: { in: "body", type: "string", desc: "Search query." },
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "search_mentions",
    method: "POST",
    path: "/mentions",
    description: "Get tweets that mention a user handle (newest first), with optional engagement and date filters.",
    params: {
      query: { in: "body", type: "string", desc: "User handle to find mentions of (or a search expression)." },
      min_likes: { in: "body", type: "integer", desc: "Minimum likes filter." },
      min_replies: { in: "body", type: "integer", desc: "Minimum replies filter." },
      min_retweets: { in: "body", type: "integer", desc: "Minimum retweets filter." },
      since_date: { in: "body", type: "string", desc: "Only tweets after this date (YYYY-MM-DD)." },
      until_date: { in: "body", type: "string", desc: "Only tweets before this date (YYYY-MM-DD)." },
      order: { in: "body", type: "string", desc: "Sort order." },
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_space_info",
    method: "GET",
    path: "/spaces",
    description: "Get information about an X/Twitter Space: title, state, schedule, host and participants.",
    params: {
      id: { in: "query", type: "string", desc: "Space ID (provide id or link)." },
      link: { in: "query", type: "string", desc: "Full Space URL." },
    },
  },

  // ---- Community ----
  {
    name: "get_community_members",
    method: "POST",
    path: "/community-members",
    description: "Get a paginated list of member profiles of an X/Twitter Community.",
    params: {
      community_link: { in: "body", type: "string", required: true, desc: "Community ID or full community URL." },
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_community_tweets",
    method: "POST",
    path: "/community-tweets",
    description: "Get a paginated feed of tweets published inside an X/Twitter Community.",
    params: {
      community_id: { in: "body", type: "string", required: true, desc: "Numeric community ID." },
      order: { in: "body", type: "string", enum: ["popular", "latest"], desc: "Sort order. Defaults to latest." },
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "search_community_tweets",
    method: "POST",
    path: "/community-search-tweets",
    description: "Search tweets by keyword within a specific X/Twitter Community.",
    params: {
      community_link: { in: "body", type: "string", required: true, desc: "Community ID or full community URL." },
      query: { in: "body", type: "string", desc: "Search query string." },
      order: { in: "body", type: "string", enum: ["popular", "latest"], desc: "Sort order." },
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },

  // ---- Verification / checks ----
  {
    name: "check_follow",
    method: "POST",
    path: "/check-follow",
    description: "Check whether account 2 follows account 1. Identify each account by id, link, or username (one per side).",
    params: {
      user_id_1: { in: "body", type: "string", desc: "Account that should be followed — numeric ID." },
      user_link_1: { in: "body", type: "string", desc: "Account that should be followed — profile URL." },
      username_1: { in: "body", type: "string", desc: "Account that should be followed — handle." },
      user_id_2: { in: "body", type: "string", desc: "Account being checked — numeric ID." },
      user_link_2: { in: "body", type: "string", desc: "Account being checked — profile URL." },
      username_2: { in: "body", type: "string", desc: "Account being checked — handle." },
    },
  },
  {
    name: "check_comment",
    method: "GET",
    path: "/check-comment",
    description: "Check whether a user has replied under a given tweet. Returns commented: true plus the reply if found.",
    params: {
      tweet_link: { in: "query", type: "string", required: true, desc: "Full URL of the tweet to check." },
      username: { in: "query", type: "string", desc: "Handle of the user being checked." },
      user_link: { in: "query", type: "string", desc: "Profile URL of the user being checked." },
      user_id: { in: "query", type: "string", desc: "Numeric ID of the user being checked." },
    },
  },
  {
    name: "check_quoted",
    method: "POST",
    path: "/check-quoted",
    description: "Check whether a user has quoted or retweeted a tweet. Returns a status of quoted / retweeted / none.",
    params: {
      tweet_link: { in: "body", type: "string", desc: "Full tweet URL or tweet ID." },
      ...userBody(),
    },
  },
  {
    name: "check_retweet",
    method: "POST",
    path: "/check-retweet",
    description: "Check whether a user has retweeted a tweet. Scans up to 100 retweets per request; paginate with next_cursor for popular tweets.",
    params: {
      tweet_link: { in: "body", type: "string", desc: "Full tweet URL or tweet ID." },
      ...userBody(),
      next_cursor: { in: "body", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "check_community_member",
    method: "POST",
    path: "/check-community-member",
    description: "Check whether a user is a member of a given X/Twitter Community. Returns is_member: true/false.",
    params: {
      community_id: { in: "body", type: "string", required: true, desc: "Numeric community ID." },
      ...userBody(),
    },
  },

  // ---- Sorsa info / crypto ----
  {
    name: "get_sorsa_score",
    method: "GET",
    path: "/score",
    description: "Get the Sorsa Score for an account — a numeric estimate of its recognition and influence.",
    params: userQuery(),
  },
  {
    name: "get_sorsa_score_changes",
    method: "GET",
    path: "/score-changes",
    description: "Get the change in Sorsa Score over the last 7 and 30 days.",
    params: userQuery(),
  },
  {
    name: "get_followers_stats",
    method: "GET",
    path: "/followers-stats",
    description: "Get a breakdown of an account's followers by Sorsa category: influencers, projects, and VC employees.",
    params: userQuery(),
  },
  {
    name: "get_top_followers",
    method: "GET",
    path: "/top-followers",
    description: "Get the 20 followers of an account with the highest Sorsa Score.",
    params: userQuery(),
  },
  {
    name: "get_top_following",
    method: "GET",
    path: "/top-following",
    description: "Get the 20 accounts a user follows with the highest Sorsa Score.",
    params: userQuery(),
  },
  {
    name: "get_new_followers_7d",
    method: "GET",
    path: "/new-followers-7d",
    description: "Get accounts that started following the user in the last 7 days (crypto ecosystem).",
    params: userQuery(),
  },
  {
    name: "get_new_following_7d",
    method: "GET",
    path: "/new-following-7d",
    description: "Get accounts the user started following in the last 7 days (crypto ecosystem).",
    params: userQuery(),
  },

  // ---- Lists ----
  {
    name: "get_list_members",
    method: "GET",
    path: "/list-members",
    description: "Get profiles of all accounts in an X/Twitter List.",
    params: {
      list_id: { in: "query", type: "string", required: true, desc: "Numeric ID of the List." },
      next_cursor: { in: "query", type: "integer", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_list_tweets",
    method: "GET",
    path: "/list-tweets",
    description: "Get a paginated feed of tweets from members of an X/Twitter List (up to 20 per page).",
    params: {
      list_id: { in: "query", type: "string", required: true, desc: "Numeric ID of the List." },
      next_cursor: { in: "query", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },
  {
    name: "get_list_followers",
    method: "GET",
    path: "/list-followers",
    description: "Get accounts that follow (are subscribed to) an X/Twitter List.",
    params: {
      list_link: { in: "query", type: "string", required: true, desc: "Full URL or ID of the List." },
      next_cursor: { in: "query", type: "string", desc: "Pagination cursor from a previous response." },
    },
  },

  // ---- Technical / utilities ----
  {
    name: "username_to_id",
    method: "GET",
    path: "/username-to-id/{user_handle}",
    description: "Convert an X/Twitter username into its stable numeric user ID.",
    params: {
      user_handle: { in: "path", type: "string", required: true, desc: "X/Twitter handle (without @)." },
    },
  },
  {
    name: "id_to_username",
    method: "GET",
    path: "/id-to-username/{user_id}",
    description: "Convert a numeric X/Twitter user ID into the account's current username.",
    params: {
      user_id: { in: "path", type: "string", required: true, desc: "Numeric X/Twitter user ID." },
    },
  },
  {
    name: "link_to_id",
    method: "GET",
    path: "/link-to-id",
    description: "Extract the stable numeric user ID from a profile URL.",
    params: {
      link: { in: "query", type: "string", required: true, desc: "Full X/Twitter profile URL." },
    },
  },
  {
    name: "get_key_usage_info",
    method: "GET",
    path: "/key-usage-info",
    description: "Get usage stats for the current API key: total allocated requests, remaining balance, and expiration date.",
    params: {},
  },
];
