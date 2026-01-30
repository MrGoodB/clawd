---
name: reddit
description: Browse and interact with Reddit - read posts, comments, subreddits, and user profiles. Use when you need to monitor subreddits, search Reddit content, or gather community insights. Read-only by default (no auth), posting requires OAuth.
---

# Reddit API

Access Reddit content via JSON API (no auth for reading) or OAuth (for posting).

## Read Without Auth

Add `.json` to any Reddit URL:

```bash
# Subreddit posts
curl -s "https://www.reddit.com/r/artificial/hot.json?limit=10" \
  -H "User-Agent: Clawdbot/1.0" | jq '.data.children[].data | {title, score, url, permalink}'

# Post comments
curl -s "https://www.reddit.com/r/artificial/comments/POST_ID.json" \
  -H "User-Agent: Clawdbot/1.0" | jq '.[1].data.children[].data | {author, body, score}'
```

Always include User-Agent header.

## Subreddit Feeds

```bash
# Hot posts
curl -s "https://www.reddit.com/r/technology/hot.json?limit=25" \
  -H "User-Agent: Clawdbot/1.0" | jq '.data.children[].data | {title, score, num_comments}'

# New posts
curl -s "https://www.reddit.com/r/technology/new.json?limit=25" \
  -H "User-Agent: Clawdbot/1.0"

# Top posts (today/week/month/year/all)
curl -s "https://www.reddit.com/r/technology/top.json?t=week&limit=25" \
  -H "User-Agent: Clawdbot/1.0"

# Rising posts
curl -s "https://www.reddit.com/r/technology/rising.json" \
  -H "User-Agent: Clawdbot/1.0"
```

## Search Reddit

```bash
# Search all of Reddit
curl -s "https://www.reddit.com/search.json?q=artificial%20intelligence&sort=relevance&limit=25" \
  -H "User-Agent: Clawdbot/1.0" | jq '.data.children[].data | {subreddit, title, score}'

# Search within subreddit
curl -s "https://www.reddit.com/r/MachineLearning/search.json?q=transformer&restrict_sr=on&limit=25" \
  -H "User-Agent: Clawdbot/1.0"
```

## User Profile

```bash
USERNAME="spez"

# User's posts
curl -s "https://www.reddit.com/user/${USERNAME}/submitted.json" \
  -H "User-Agent: Clawdbot/1.0" | jq '.data.children[].data | {title, subreddit, score}'

# User's comments
curl -s "https://www.reddit.com/user/${USERNAME}/comments.json" \
  -H "User-Agent: Clawdbot/1.0" | jq '.data.children[].data | {body, subreddit, score}'

# User about
curl -s "https://www.reddit.com/user/${USERNAME}/about.json" \
  -H "User-Agent: Clawdbot/1.0" | jq '.data | {name, total_karma, created_utc}'
```

## Subreddit Info

```bash
SUBREDDIT="artificial"

curl -s "https://www.reddit.com/r/${SUBREDDIT}/about.json" \
  -H "User-Agent: Clawdbot/1.0" | jq '.data | {display_name, subscribers, public_description}'
```

## Pagination

Use `after` parameter with the `name` of the last item:

```bash
# First page
RESPONSE=$(curl -s "https://www.reddit.com/r/technology/hot.json?limit=25" \
  -H "User-Agent: Clawdbot/1.0")

AFTER=$(echo $RESPONSE | jq -r '.data.after')

# Next page
curl -s "https://www.reddit.com/r/technology/hot.json?limit=25&after=${AFTER}" \
  -H "User-Agent: Clawdbot/1.0"
```

## Multi-Subreddit

```bash
# Combine multiple subreddits
curl -s "https://www.reddit.com/r/artificial+MachineLearning+deeplearning/hot.json?limit=25" \
  -H "User-Agent: Clawdbot/1.0"
```

## OAuth Setup (For Posting)

1. Create app: https://www.reddit.com/prefs/apps
2. Note client_id and secret
3. Get access token:

```bash
CLIENT_ID="your_client_id"
CLIENT_SECRET="your_secret"

# Script/personal use token
curl -s -X POST "https://www.reddit.com/api/v1/access_token" \
  -u "${CLIENT_ID}:${CLIENT_SECRET}" \
  -d "grant_type=password&username=YOUR_USERNAME&password=YOUR_PASSWORD" \
  -H "User-Agent: Clawdbot/1.0" | jq '.access_token'
```

## Posting (Requires OAuth)

```bash
ACCESS_TOKEN="your_token"

# Submit link post
curl -s -X POST "https://oauth.reddit.com/api/submit" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "User-Agent: Clawdbot/1.0" \
  -d "sr=test&kind=link&title=Test%20Post&url=https://example.com"

# Submit text post
curl -s -X POST "https://oauth.reddit.com/api/submit" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "User-Agent: Clawdbot/1.0" \
  -d "sr=test&kind=self&title=Test%20Post&text=Post%20content%20here"
```

## Comment (Requires OAuth)

```bash
THING_ID="t3_POST_ID"  # t3_ for posts, t1_ for comments

curl -s -X POST "https://oauth.reddit.com/api/comment" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "User-Agent: Clawdbot/1.0" \
  -d "thing_id=${THING_ID}&text=Your%20comment%20here"
```

## Rate Limits

- 60 requests/minute (with OAuth)
- 10 requests/minute (without OAuth)
- Respect `X-Ratelimit-*` headers
