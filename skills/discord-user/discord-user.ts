#!/usr/bin/env npx ts-node
/**
 * Discord User CLI - Act as a human user via auth token
 * Usage: discord-user <command> [options]
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const BASE_URL = 'https://discord.com/api/v10'
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

interface Config {
  token?: string
}

function loadConfig(): Config {
  const toolsPath = join(process.env.HOME || '', 'clawd', 'TOOLS.md')
  if (existsSync(toolsPath)) {
    const content = readFileSync(toolsPath, 'utf-8')
    const tokenMatch = content.match(/### Discord \(User\)[\s\S]*?token:\s*`([^`]+)`/)
    return {
      token: tokenMatch?.[1] || process.env.DISCORD_USER_TOKEN,
    }
  }
  return { token: process.env.DISCORD_USER_TOKEN }
}

async function apiRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Discord API error ${response.status}: ${text}`)
  }
  
  if (response.status === 204) return null
  return response.json()
}

async function servers(token: string) {
  const guilds = await apiRequest('/users/@me/guilds', token)
  
  console.log('\n🏰 Your Servers\n')
  for (const g of guilds) {
    console.log(`${g.name}`)
    console.log(`   ID: ${g.id} | Owner: ${g.owner ? '👑' : ''}`)
  }
}

async function channels(serverId: string, token: string) {
  const chs = await apiRequest(`/guilds/${serverId}/channels`, token)
  
  console.log('\n📺 Channels\n')
  
  // Group by category
  const categories: Record<string, any[]> = { '': [] }
  for (const ch of chs) {
    if (ch.type === 4) {
      categories[ch.id] = []
    }
  }
  
  for (const ch of chs) {
    if (ch.type === 4) continue
    const parent = ch.parent_id || ''
    if (!categories[parent]) categories[parent] = []
    categories[parent].push(ch)
  }
  
  for (const [catId, channels] of Object.entries(categories)) {
    const cat = chs.find((c: any) => c.id === catId)
    if (cat) console.log(`\n📁 ${cat.name}`)
    
    for (const ch of channels) {
      const icon = ch.type === 0 ? '#' : ch.type === 2 ? '🔊' : '📝'
      console.log(`   ${icon} ${ch.name} (${ch.id})`)
    }
  }
}

async function read(channelId: string, limit: number, token: string) {
  const messages = await apiRequest(`/channels/${channelId}/messages?limit=${limit}`, token)
  
  console.log('\n💬 Messages\n')
  
  for (const msg of messages.reverse()) {
    const time = new Date(msg.timestamp).toLocaleTimeString()
    console.log(`[${time}] ${msg.author.username}: ${msg.content.slice(0, 200)}`)
    if (msg.attachments?.length) {
      console.log(`   📎 ${msg.attachments.length} attachment(s)`)
    }
  }
}

async function send(channelId: string, content: string, token: string, replyTo?: string) {
  const body: any = { content }
  if (replyTo) {
    body.message_reference = { message_id: replyTo }
  }
  
  const msg = await apiRequest(`/channels/${channelId}/messages`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  
  console.log(`✅ Sent message: ${msg.id}`)
}

async function react(channelId: string, messageId: string, emoji: string, token: string) {
  // URL encode the emoji
  const encodedEmoji = encodeURIComponent(emoji)
  
  await apiRequest(
    `/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`,
    token,
    { method: 'PUT' }
  )
  
  console.log(`✅ Reacted with ${emoji}`)
}

async function dm(userId: string, content: string, token: string) {
  // Create DM channel first
  const channel = await apiRequest('/users/@me/channels', token, {
    method: 'POST',
    body: JSON.stringify({ recipient_id: userId }),
  })
  
  // Send message
  await send(channel.id, content, token)
}

async function joinServer(inviteCode: string, token: string) {
  const code = inviteCode.replace('https://discord.gg/', '').replace('discord.gg/', '')
  
  const result = await apiRequest(`/invites/${code}`, token, {
    method: 'POST',
  })
  
  console.log(`✅ Joined server: ${result.guild?.name || 'Unknown'}`)
}

async function search(serverId: string, query: string, limit: number, token: string) {
  const params = new URLSearchParams({
    content: query,
    limit: limit.toString(),
  })
  
  const results = await apiRequest(`/guilds/${serverId}/messages/search?${params}`, token)
  
  console.log(`\n🔍 Search: "${query}"\n`)
  
  for (const msg of results.messages || []) {
    const m = msg[0]
    const time = new Date(m.timestamp).toLocaleDateString()
    console.log(`[${time}] #${m.channel_id} | ${m.author.username}:`)
    console.log(`   ${m.content.slice(0, 150)}`)
    console.log(`   ID: ${m.id}`)
    console.log()
  }
}

async function userInfo(userId: string, token: string) {
  const user = await apiRequest(`/users/${userId}`, token)
  
  console.log(`\n👤 ${user.username}#${user.discriminator}`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Bot: ${user.bot ? '🤖' : '👤'}`)
  console.log(`   Created: ${new Date(Number((BigInt(user.id) >> 22n) + 1420070400000n)).toLocaleDateString()}`)
}

async function me(token: string) {
  const user = await apiRequest('/users/@me', token)
  
  console.log(`\n👤 ${user.username}#${user.discriminator}`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${user.email || 'N/A'}`)
  console.log(`   Verified: ${user.verified ? '✅' : '❌'}`)
}

// CLI
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const config = loadConfig()
  
  if (!config.token) {
    console.error('❌ No Discord user token found.')
    console.error('   Add to TOOLS.md under "### Discord (User)" or set DISCORD_USER_TOKEN')
    process.exit(1)
  }
  
  try {
    switch (command) {
      case 'servers':
        await servers(config.token)
        break
        
      case 'channels':
        await channels(args[1], config.token)
        break
        
      case 'read': {
        const limitIdx = args.indexOf('--limit')
        const limit = limitIdx > -1 ? parseInt(args[limitIdx + 1]) : 50
        await read(args[1], limit, config.token)
        break
      }
        
      case 'send':
        await send(args[1], args.slice(2).join(' '), config.token)
        break
        
      case 'reply':
        await send(args[1], args.slice(3).join(' '), config.token, args[2])
        break
        
      case 'react':
        await react(args[1], args[2], args[3], config.token)
        break
        
      case 'dm':
        await dm(args[1], args.slice(2).join(' '), config.token)
        break
        
      case 'join':
        await joinServer(args[1], config.token)
        break
        
      case 'search': {
        const limitIdx = args.indexOf('--limit')
        const limit = limitIdx > -1 ? parseInt(args[limitIdx + 1]) : 25
        const query = args.slice(2).filter(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--limit').join(' ')
        await search(args[1], query, limit, config.token)
        break
      }
        
      case 'user':
        await userInfo(args[1], config.token)
        break
        
      case 'me':
        await me(config.token)
        break
        
      default:
        console.log(`
Discord User CLI - Act as a human user

Commands:
  servers                              List your servers
  channels <server_id>                 List channels in server
  read <channel_id> [--limit N]        Read recent messages
  send <channel_id> <message>          Send a message
  reply <channel_id> <msg_id> <text>   Reply to a message
  react <channel_id> <msg_id> <emoji>  React to a message
  dm <user_id> <message>               Send a DM
  join <invite_code>                   Join a server
  search <server_id> <query>           Search messages
  user <user_id>                       Get user info
  me                                   Get your info
`)
    }
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()
