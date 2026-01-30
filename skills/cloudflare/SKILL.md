---
name: cloudflare
description: Manage Cloudflare DNS, Workers, and KV storage. Use when you need to manage DNS records, deploy Workers, interact with KV storage, or configure Cloudflare services via API.
---

# Cloudflare API

Manage DNS, Workers, KV, and other Cloudflare services.

## Setup

1. Get API token: https://dash.cloudflare.com/profile/api-tokens
2. Create token with permissions for the services you need
3. Store token:
```bash
mkdir -p ~/.config/cloudflare
echo "YOUR_API_TOKEN" > ~/.config/cloudflare/api_token
```

## API Basics

```bash
CF_TOKEN=$(cat ~/.config/cloudflare/api_token)

curl -s "https://api.cloudflare.com/client/v4/user" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq
```

## List Zones (Domains)

```bash
curl -s "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq '.result[] | {id, name, status}'
```

## DNS Records

List:
```bash
ZONE_ID="your_zone_id"

curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq '.result[] | {id, type, name, content}'
```

Create:
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "A",
    "name": "subdomain",
    "content": "192.0.2.1",
    "ttl": 1,
    "proxied": true
  }' | jq
```

Update:
```bash
RECORD_ID="record_id"

curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content": "192.0.2.2"}' | jq
```

Delete:
```bash
curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq
```

## Workers

List:
```bash
ACCOUNT_ID="your_account_id"

curl -s "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq '.result[] | {id, modified_on}'
```

Deploy Worker:
```bash
WORKER_NAME="my-worker"

curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/javascript" \
  --data-binary @worker.js | jq
```

Delete Worker:
```bash
curl -s -X DELETE "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq
```

## Workers KV

List Namespaces:
```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq '.result[] | {id, title}'
```

Create Namespace:
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title": "MY_KV_NAMESPACE"}' | jq
```

Write Key:
```bash
NAMESPACE_ID="namespace_id"
KEY="my-key"

curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/${KEY}" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: text/plain" \
  --data "my-value" | jq
```

Read Key:
```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/${KEY}" \
  -H "Authorization: Bearer ${CF_TOKEN}"
```

List Keys:
```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/keys" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq '.result[] | .name'
```

Delete Key:
```bash
curl -s -X DELETE "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/${KEY}" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq
```

## Purge Cache

Purge everything:
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything": true}' | jq
```

Purge specific URLs:
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"files": ["https://example.com/style.css", "https://example.com/script.js"]}' | jq
```

## CLI (Wrangler)

```bash
npm i -g wrangler

wrangler login
wrangler init my-worker
wrangler dev          # Local development
wrangler deploy       # Deploy to production
wrangler kv:key put --binding=MY_KV "key" "value"
wrangler kv:key get --binding=MY_KV "key"
```

## Rate Limits

- 1200 requests/5 minutes (most endpoints)
- KV: 1000 writes/second, unlimited reads
