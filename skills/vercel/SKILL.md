---
name: vercel
description: Deploy and manage projects on Vercel. Use when you need to deploy apps, check deployment status, manage domains, or interact with Vercel's hosting platform via API or CLI.
---

# Vercel API & CLI

Deploy and manage projects on Vercel.

## CLI Setup

```bash
npm i -g vercel
vercel login  # Opens browser for auth
```

## Deploy (CLI)

```bash
# Deploy current directory
vercel

# Deploy to production
vercel --prod

# Deploy specific directory
vercel ./dist --prod

# Deploy with environment variables
vercel --env DATABASE_URL=xxx --prod
```

## API Setup

1. Get token: https://vercel.com/account/tokens
2. Store token:
```bash
mkdir -p ~/.config/vercel
echo "YOUR_TOKEN" > ~/.config/vercel/token
```

## API Basics

```bash
VERCEL_TOKEN=$(cat ~/.config/vercel/token)

curl -s "https://api.vercel.com/v2/user" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | jq
```

## List Projects

```bash
curl -s "https://api.vercel.com/v9/projects" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | jq '.projects[] | {id, name, framework}'
```

## Get Project

```bash
PROJECT_ID="prj_XXXXX"

curl -s "https://api.vercel.com/v9/projects/${PROJECT_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | jq
```

## List Deployments

```bash
curl -s "https://api.vercel.com/v6/deployments" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | jq '.deployments[] | {uid, name, state, url, created}'
```

## Get Deployment

```bash
DEPLOYMENT_ID="dpl_XXXXX"

curl -s "https://api.vercel.com/v13/deployments/${DEPLOYMENT_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | jq '{id, url, state, readyState}'
```

## Create Deployment (from Git)

```bash
curl -s -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-project",
    "gitSource": {
      "type": "github",
      "repo": "username/repo",
      "ref": "main"
    }
  }' | jq
```

## List Domains

```bash
curl -s "https://api.vercel.com/v5/domains" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | jq '.domains[] | {name, verified}'
```

## Add Domain to Project

```bash
curl -s -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/domains" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "example.com"}' | jq
```

## Environment Variables

List:
```bash
curl -s "https://api.vercel.com/v9/projects/${PROJECT_ID}/env" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | jq '.envs[] | {key, target, type}'
```

Create:
```bash
curl -s -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "DATABASE_URL",
    "value": "postgres://...",
    "type": "encrypted",
    "target": ["production", "preview"]
  }' | jq
```

## Delete Deployment

```bash
curl -s -X DELETE "https://api.vercel.com/v13/deployments/${DEPLOYMENT_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}"
```

## Deployment Logs

```bash
curl -s "https://api.vercel.com/v2/deployments/${DEPLOYMENT_ID}/events" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | jq '.[] | {created, text}'
```

## Promote to Production

```bash
curl -s -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/promote/${DEPLOYMENT_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | jq
```

## CLI Commands Reference

```bash
# Link directory to project
vercel link

# Pull environment variables
vercel env pull

# List environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Inspect deployment
vercel inspect <deployment-url>

# List deployments
vercel ls

# Remove deployment
vercel rm <deployment-url>

# Promote to production
vercel promote <deployment-url>

# Rollback
vercel rollback
```

## Rate Limits

- 100 requests per 60 seconds (per token)
- Higher limits for Team/Enterprise
