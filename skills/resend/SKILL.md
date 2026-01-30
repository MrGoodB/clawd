---
name: resend
description: Send transactional emails via Resend API. Use when you need to send emails programmatically - notifications, alerts, reports, or any automated email communication. Simple API with great deliverability.
---

# Resend API

Send emails via Resend's simple API.

## Setup

1. Get API key: https://resend.com/api-keys
2. Store key:
```bash
mkdir -p ~/.config/resend
echo "re_XXXXX" > ~/.config/resend/api_key
```
3. Verify domain: Resend → Domains → Add domain (add DNS records)

## Send Email

```bash
RESEND_KEY=$(cat ~/.config/resend/api_key)

curl -s -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "notifications@yourdomain.com",
    "to": ["recipient@example.com"],
    "subject": "Hello from Clawdbot",
    "text": "This is a test email sent via Resend API."
  }' | jq
```

## Send HTML Email

```bash
curl -s -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "alerts@yourdomain.com",
    "to": ["recipient@example.com"],
    "subject": "Weekly Report",
    "html": "<h1>Weekly Report</h1><p>Here are your stats...</p>"
  }' | jq
```

## Multiple Recipients

```bash
curl -s -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "team@yourdomain.com",
    "to": ["user1@example.com", "user2@example.com"],
    "cc": ["manager@example.com"],
    "bcc": ["archive@example.com"],
    "subject": "Team Update",
    "text": "Important announcement..."
  }' | jq
```

## With Reply-To

```bash
curl -s -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@yourdomain.com",
    "reply_to": "support@yourdomain.com",
    "to": ["customer@example.com"],
    "subject": "Your Order Confirmation",
    "text": "Thank you for your order!"
  }' | jq
```

## With Attachments

```bash
# Base64 encode the file
FILE_CONTENT=$(base64 -w 0 /path/to/file.pdf)

curl -s -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "reports@yourdomain.com",
    "to": ["recipient@example.com"],
    "subject": "Your Report",
    "text": "Please find your report attached.",
    "attachments": [{
      "filename": "report.pdf",
      "content": "'$FILE_CONTENT'"
    }]
  }' | jq
```

## Custom Headers

```bash
curl -s -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "notifications@yourdomain.com",
    "to": ["recipient@example.com"],
    "subject": "Notification",
    "text": "You have a new message.",
    "headers": {
      "X-Entity-Ref-ID": "123456"
    }
  }' | jq
```

## Get Email Status

```bash
EMAIL_ID="email_id_from_send_response"

curl -s "https://api.resend.com/emails/${EMAIL_ID}" \
  -H "Authorization: Bearer ${RESEND_KEY}" | jq
```

## List Domains

```bash
curl -s "https://api.resend.com/domains" \
  -H "Authorization: Bearer ${RESEND_KEY}" | jq '.data[] | {id, name, status}'
```

## Get Domain

```bash
DOMAIN_ID="domain_id"

curl -s "https://api.resend.com/domains/${DOMAIN_ID}" \
  -H "Authorization: Bearer ${RESEND_KEY}" | jq
```

## Using onboarding@resend.dev (Testing)

For testing without domain verification:
```bash
curl -s -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": ["your-email@example.com"],
    "subject": "Test Email",
    "text": "Testing Resend!"
  }' | jq
```

Only delivers to the email address of your Resend account.

## Batch Send

```bash
curl -s -X POST "https://api.resend.com/emails/batch" \
  -H "Authorization: Bearer ${RESEND_KEY}" \
  -H "Content-Type: application/json" \
  -d '[
    {"from": "notifications@yourdomain.com", "to": ["user1@example.com"], "subject": "Hello User 1", "text": "Message 1"},
    {"from": "notifications@yourdomain.com", "to": ["user2@example.com"], "subject": "Hello User 2", "text": "Message 2"}
  ]' | jq
```

Max 100 emails per batch.

## Rate Limits

- Free: 100 emails/day, 1 email/second
- Pro: 50,000 emails/month, 10 emails/second
- Check headers: `X-RateLimit-Remaining`
