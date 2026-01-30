---
name: discord-user
description: Interact with Discord as a human user (not a bot). Join servers, send messages, DM users, react to messages. Use for organic community participation and promotion.
---

# Discord User Skill

Control Discord as a human user via auth token.

## ⚠️ Important

This uses a **user token**, not a bot token. This is technically against Discord ToS but is commonly used for automation. Use responsibly:
- Don't spam or harass
- Respect rate limits
- Don't automate at scale

## Setup

Get your Discord user token:
1. Open Discord in browser (not app)
2. Open DevTools (F12) → Network tab
3. Do any action (send message, etc)
4. Find a request to `discord.com/api`
5. Look at request headers → copy `Authorization` value

Add to TOOLS.md:
```markdown
### Discord (User)
- token: `your_user_token_here`
```

Or set env: `DISCORD_USER_TOKEN`

## Commands

### List servers
```bash
discord-user servers
```

### List channels in server
```bash
discord-user channels <server_id>
```

### Read messages
```bash
discord-user read <channel_id> --limit 50
```

### Send message
```bash
discord-user send <channel_id> "Hello world!"
```

### Reply to message
```bash
discord-user reply <channel_id> <message_id> "Great point!"
```

### React to message
```bash
discord-user react <channel_id> <message_id> 👍
```

### DM a user
```bash
discord-user dm <user_id> "Hey, quick question..."
```

### Join server via invite
```bash
discord-user join <invite_code>
```

### Search messages
```bash
discord-user search <server_id> "AI assistant" --limit 25
```

### Get user info
```bash
discord-user user <user_id>
discord-user me
```

## Best Practices for Community Engagement

1. **Lurk first** - Understand the community vibe before posting
2. **Help people** - Answer questions genuinely
3. **Don't spam links** - Mention your project only when relevant
4. **Use reactions** - Show engagement without cluttering chat
5. **Respect channel topics** - Post in appropriate channels

## Target Communities for Asklee

| Server | Focus | How to contribute |
|--------|-------|-------------------|
| OpenClaw | AI assistants | Help users, share tips |
| Indie Hackers | Startups | Share journey, help others |
| AI/ML Discord | AI tech | Technical discussions |
| Developer Hangout | General dev | Answer coding questions |

## Rate Limits

- Messages: ~5 per 5 seconds
- Reactions: ~1 per 0.25 seconds
- Join servers: Be very careful, can trigger captcha

## Example Workflow

```bash
# See your servers
discord-user servers

# Check a channel
discord-user read 123456789 --limit 30

# Find relevant discussions
discord-user search 987654321 "WhatsApp bot"

# Help someone
discord-user reply 123456789 111222333 "I built something for this actually - you can try Asklee, it deploys a bot in 60 seconds"

# React to good posts
discord-user react 123456789 111222333 🔥
```
