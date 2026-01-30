---
name: linear
description: Manage issues, projects, and teams in Linear. Use when you need to create issues, update status, list tasks, or interact with Linear's issue tracking system. Supports GraphQL API for all operations.
---

# Linear API

Interact with Linear issue tracking via GraphQL API.

## Setup

1. Get API key: Linear Settings → API → Personal API keys
2. Store key:
```bash
mkdir -p ~/.config/linear
echo "lin_api_YOUR_KEY" > ~/.config/linear/api_key
```

## API Basics

All requests use GraphQL:
```bash
LINEAR_KEY=$(cat ~/.config/linear/api_key)

curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{"query": "{ viewer { id name email } }"}'
```

## List My Issues

```bash
curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{
    "query": "{ issues(filter: { assignee: { isMe: { eq: true } } }) { nodes { id identifier title state { name } priority } } }"
  }' | jq '.data.issues.nodes'
```

## Create Issue

```bash
curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{
    "query": "mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title url } } }",
    "variables": {
      "input": {
        "teamId": "TEAM_ID",
        "title": "Issue title",
        "description": "Issue description",
        "priority": 2
      }
    }
  }'
```

Priority: 0=No priority, 1=Urgent, 2=High, 3=Medium, 4=Low

## Get Teams

```bash
curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{"query": "{ teams { nodes { id name key } } }"}' | jq '.data.teams.nodes'
```

## Get Workflow States

```bash
curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{
    "query": "{ workflowStates { nodes { id name type team { name } } } }"
  }' | jq '.data.workflowStates.nodes'
```

## Update Issue Status

```bash
curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{
    "query": "mutation UpdateIssue($id: String!, $stateId: String!) { issueUpdate(id: $id, input: { stateId: $stateId }) { success } }",
    "variables": {
      "id": "ISSUE_ID",
      "stateId": "STATE_ID"
    }
  }'
```

## Add Comment

```bash
curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{
    "query": "mutation CreateComment($input: CommentCreateInput!) { commentCreate(input: $input) { success } }",
    "variables": {
      "input": {
        "issueId": "ISSUE_ID",
        "body": "Comment text with **markdown** support"
      }
    }
  }'
```

## Search Issues

```bash
curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{
    "query": "{ issueSearch(query: \"bug\") { nodes { identifier title state { name } } } }"
  }' | jq '.data.issueSearch.nodes'
```

## Get Issue by Identifier

```bash
curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{
    "query": "{ issue(id: \"ABC-123\") { id title description state { name } assignee { name } } }"
  }'
```

## List Projects

```bash
curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{"query": "{ projects { nodes { id name state } } }"}' | jq '.data.projects.nodes'
```

## Webhooks

Create via Linear Settings → API → Webhooks, or:
```bash
curl -s -X POST "https://api.linear.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_KEY}" \
  -d '{
    "query": "mutation { webhookCreate(input: { url: \"https://your.webhook.url\", teamId: \"TEAM_ID\", resourceTypes: [\"Issue\"] }) { success webhook { id } } }"
  }'
```

## Rate Limits

- 1500 requests per hour
- Complexity limit per query
- Use pagination for large datasets
