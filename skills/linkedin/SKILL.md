---
name: linkedin
description: Post, comment, and engage on LinkedIn as a human user. Use for thought leadership, professional networking, and B2B promotion.
---

# LinkedIn Skill

Control LinkedIn as a human user via session cookies.

## ⚠️ Important

LinkedIn is aggressive about detecting automation. Use carefully:
- Human-like delays between actions
- Don't bulk-action anything
- Warm up gradually
- Account bans are permanent

## Setup

Get LinkedIn cookies from browser:
1. Log into LinkedIn in browser
2. Open DevTools → Application → Cookies → linkedin.com
3. Copy these cookies: `li_at`, `JSESSIONID`

Add to TOOLS.md:
```markdown
### LinkedIn
- li_at: `your_li_at_cookie`
- JSESSIONID: `your_jsessionid`
```

Or set env vars: `LINKEDIN_LI_AT`, `LINKEDIN_JSESSIONID`

## Commands

### View your profile
```bash
linkedin me
```

### View someone's profile
```bash
linkedin profile <username_or_url>
```

### Post an update
```bash
linkedin post "Excited to share that we just launched Asklee..."
linkedin post "Check this out!" --image /path/to/image.jpg
linkedin post "New article!" --article "https://..."
```

### Comment on a post
```bash
linkedin comment <post_urn> "Great insights! We've seen similar results..."
```

### Like a post
```bash
linkedin like <post_urn>
```

### View feed
```bash
linkedin feed --limit 20
```

### Search people
```bash
linkedin search "AI startup founder" --limit 25
```

### Send connection request
```bash
linkedin connect <profile_id> "Hi! I noticed we're both working on AI tools..."
```

### Send message (to 1st connections)
```bash
linkedin message <profile_id> "Thanks for connecting! Quick question..."
```

## Best Practices for LinkedIn

1. **Quality over quantity** - 2-3 thoughtful posts/week max
2. **Engage first** - Comment on others' posts before posting yours
3. **Personal stories work** - "I built X" > "X is now available"
4. **No hard sell** - Share value, insights, lessons learned
5. **Respond to comments** - Boost engagement within 1 hour

## Content Ideas for Asklee

1. **Launch story** - "Why I built an AI assistant deployer"
2. **Technical deep-dive** - "How we got WhatsApp bots to cold-start in <1s"
3. **User stories** - "A customer deployed 15 bots in one afternoon"
4. **Market insights** - "Why AI assistants are moving to messaging apps"
5. **Behind the scenes** - "Week 1 building Asklee: lessons learned"

## Post Format That Works

```
Hook line that creates curiosity

Story or context (2-3 sentences)

The insight or lesson

• Bullet point 1
• Bullet point 2  
• Bullet point 3

Call to action or question

#relevanthashtag #aitools
```

## Rate Limits

- Posts: Max 1-2 per day
- Comments: ~10-20 per day
- Likes: ~50 per day
- Connection requests: ~20 per week (be very careful)
- Messages: ~25 per day

## Example Workflow

```bash
# Check your profile looks good
linkedin me

# See what's in your feed
linkedin feed --limit 10

# Engage with relevant posts first
linkedin like urn:li:activity:123456
linkedin comment urn:li:activity:123456 "Great point about X. We've found that..."

# Post your own content
linkedin post "Just shipped something I've been working on for months.

We made it possible to deploy an AI assistant to WhatsApp in 60 seconds.

No servers. No Docker. Just a wizard and you're live.

Here's what I learned building it:

• Speed beats features for first impressions
• WhatsApp > Telegram for non-technical users
• Sleep-on-idle saves 90% on hosting costs

Link in comments 👇

#aitools #startup #buildinpublic"

# Respond to engagement quickly
linkedin feed --limit 5
```
