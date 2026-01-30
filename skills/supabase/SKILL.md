---
name: supabase
description: Interact with Supabase databases and services - query data, manage auth, storage, and edge functions. Use when you need to work with Supabase projects via API or CLI.
---

# Supabase API & CLI

Interact with Supabase databases, auth, storage, and functions.

## CLI Setup

```bash
npm i -g supabase
supabase login  # Opens browser
```

## Project Setup

```bash
# Initialize in project directory
supabase init

# Link to existing project
supabase link --project-ref YOUR_PROJECT_REF

# Start local development
supabase start
```

## API Setup

Get keys from: Project Settings → API

```bash
mkdir -p ~/.config/supabase
echo "YOUR_SERVICE_ROLE_KEY" > ~/.config/supabase/service_key
echo "YOUR_ANON_KEY" > ~/.config/supabase/anon_key
```

## Database Queries (REST)

```bash
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_KEY=$(cat ~/.config/supabase/anon_key)

# Select all
curl -s "${SUPABASE_URL}/rest/v1/users?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | jq

# Select with filter
curl -s "${SUPABASE_URL}/rest/v1/users?select=*&status=eq.active" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | jq

# Select specific columns
curl -s "${SUPABASE_URL}/rest/v1/users?select=id,email,name" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | jq
```

## Insert Data

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/users" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"email": "user@example.com", "name": "John"}' | jq
```

## Update Data

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/users?id=eq.123" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John Updated"}' | jq
```

## Delete Data

```bash
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/users?id=eq.123" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

## Query Operators

- `eq` - equals
- `neq` - not equals
- `gt`, `gte` - greater than (or equal)
- `lt`, `lte` - less than (or equal)
- `like`, `ilike` - pattern match (ilike = case insensitive)
- `in` - in list: `status=in.(active,pending)`
- `is` - null check: `deleted_at=is.null`

## Order & Pagination

```bash
# Order by
curl -s "${SUPABASE_URL}/rest/v1/posts?select=*&order=created_at.desc"

# Pagination
curl -s "${SUPABASE_URL}/rest/v1/posts?select=*&limit=10&offset=20"

# Range header
curl -s "${SUPABASE_URL}/rest/v1/posts?select=*" \
  -H "Range: 0-9"
```

## Storage (File Upload)

```bash
BUCKET="avatars"
FILE_PATH="user123/avatar.png"

curl -s -X POST "${SUPABASE_URL}/storage/v1/object/${BUCKET}/${FILE_PATH}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: image/png" \
  --data-binary @/path/to/avatar.png | jq
```

## Storage (Get Public URL)

```bash
curl -s "${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${FILE_PATH}"
```

## Storage (List Files)

```bash
curl -s -X POST "${SUPABASE_URL}/storage/v1/object/list/${BUCKET}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"prefix": "user123/"}' | jq
```

## Edge Functions

Invoke:
```bash
curl -s -X POST "${SUPABASE_URL}/functions/v1/my-function" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}' | jq
```

Deploy (CLI):
```bash
supabase functions deploy my-function
```

## Migrations (CLI)

```bash
# Create migration
supabase migration new add_users_table

# Apply migrations
supabase db push

# Pull remote schema
supabase db pull
```

## RPC (Remote Procedure Call)

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/my_function" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"param1": "value1"}' | jq
```

## Service Role Key

For bypassing RLS (use carefully):
```bash
SERVICE_KEY=$(cat ~/.config/supabase/service_key)

curl -s "${SUPABASE_URL}/rest/v1/users?select=*" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq
```

## Rate Limits

- Free: 500 requests/day, 50MB database
- Pro: No request limits, 8GB database
