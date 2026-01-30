#!/usr/bin/env npx ts-node
/**
 * Reddit CLI - Act as a human user via session cookies
 * Usage: reddit <command> [options]
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const BASE_URL = 'https://www.reddit.com'
const OAUTH_URL = 'https://oauth.reddit.com'

interface Config {
  redditSession?: string
  tokenV2?: string
  accessToken?: string
}

function loadConfig(): Config {
  // Try TOOLS.md first
  const toolsPath = join(process.env.HOME || '', 'clawd', 'TOOLS.md')
  if (existsSync(toolsPath)) {
    const content = readFileSync(toolsPath, 'utf-8')
    const sessionMatch = content.match(/reddit_session:\s*`([^`]+)`/)
    const tokenMatch = content.match(/token_v2:\s*`([^`]+)`/)
    const accessMatch = content.match(/access_token:\s*`([^`]+)`/)
    
    return {
      redditSession: sessionMatch?.[1] || process.env.REDDIT_SESSION,
      tokenV2: tokenMatch?.[1] || process.env.REDDIT_TOKEN_V2,
      accessToken: accessMatch?.[1] || process.env.REDDIT_ACCESS_TOKEN,
    }
  }
  
  return {
    redditSession: process.env.REDDIT_SESSION,
    tokenV2: process.env.REDDIT_TOKEN_V2,
    accessToken: process.env.REDDIT_ACCESS_TOKEN,
  }
}

function getCookieHeader(config: Config): string {
  const cookies: string[] = []
  if (config.redditSession) cookies.push(`reddit_session=${config.redditSession}`)
  if (config.tokenV2) cookies.push(`token_v2=${config.tokenV2}`)
  return cookies.join('; ')
}

async function apiRequest(
  endpoint: string,
  config: Config,
  options: RequestInit = {}
): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${OAUTH_URL}${endpoint}`
  
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json',
    ...options.headers as Record<string, string>,
  }
  
  if (config.accessToken) {
    headers['Authorization'] = `Bearer ${config.accessToken}`
  } else {
    headers['Cookie'] = getCookieHeader(config)
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Reddit API error ${response.status}: ${text}`)
  }
  
  return response.json()
}

async function browse(subreddit: string, sort = 'hot', limit = 25, config: Config) {
  const sub = subreddit.replace(/^r\//, '')
  const data = await apiRequest(`/r/${sub}/${sort}?limit=${limit}`, config)
  
  console.log(`\n📋 r/${sub} - ${sort}\n`)
  
  for (const post of data.data.children) {
    const p = post.data
    const score = p.score.toString().padStart(5)
    const comments = p.num_comments.toString().padStart(4)
    const title = p.title.slice(0, 70)
    console.log(`[${score}↑ ${comments}💬] ${title}`)
    console.log(`   └─ ${p.id} | u/${p.author} | ${p.url?.slice(0, 50) || 'self'}`)
  }
}

async function read(postId: string, config: Config) {
  // Handle full URLs
  const id = postId.includes('reddit.com') 
    ? postId.match(/comments\/([a-z0-9]+)/)?.[1] || postId
    : postId
  
  const data = await apiRequest(`/comments/${id}?depth=3&limit=50`, config)
  
  const post = data[0].data.children[0].data
  console.log(`\n📝 ${post.title}`)
  console.log(`   u/${post.author} | ${post.score}↑ | ${post.num_comments} comments`)
  console.log(`\n${post.selftext || post.url}\n`)
  
  console.log('─'.repeat(60))
  console.log('Comments:\n')
  
  for (const comment of data[1].data.children.slice(0, 10)) {
    if (comment.kind !== 't1') continue
    const c = comment.data
    console.log(`[${c.score}↑] u/${c.author}:`)
    console.log(`   ${c.body.slice(0, 200).replace(/\n/g, '\n   ')}`)
    console.log()
  }
}

async function post(
  subreddit: string,
  title: string,
  config: Config,
  options: { text?: string; url?: string; image?: string }
) {
  const sub = subreddit.replace(/^r\//, '')
  
  const formData = new URLSearchParams()
  formData.append('sr', sub)
  formData.append('title', title)
  formData.append('api_type', 'json')
  
  if (options.url) {
    formData.append('kind', 'link')
    formData.append('url', options.url)
  } else if (options.text) {
    formData.append('kind', 'self')
    formData.append('text', options.text)
  }
  
  const result = await apiRequest('/api/submit', config, {
    method: 'POST',
    body: formData.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  
  if (result.json?.errors?.length) {
    console.error('❌ Error:', result.json.errors)
    return
  }
  
  console.log('✅ Posted successfully!')
  console.log(`   ${result.json?.data?.url || 'Check your profile'}`)
}

async function comment(thingId: string, text: string, config: Config) {
  const id = thingId.startsWith('t') ? thingId : `t3_${thingId}`
  
  const formData = new URLSearchParams()
  formData.append('thing_id', id)
  formData.append('text', text)
  formData.append('api_type', 'json')
  
  const result = await apiRequest('/api/comment', config, {
    method: 'POST',
    body: formData.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  
  if (result.json?.errors?.length) {
    console.error('❌ Error:', result.json.errors)
    return
  }
  
  console.log('✅ Comment posted!')
}

async function vote(thingId: string, direction: 1 | 0 | -1, config: Config) {
  const id = thingId.startsWith('t') ? thingId : `t3_${thingId}`
  
  const formData = new URLSearchParams()
  formData.append('id', id)
  formData.append('dir', direction.toString())
  
  await apiRequest('/api/vote', config, {
    method: 'POST',
    body: formData.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  
  const action = direction === 1 ? '⬆️ Upvoted' : direction === -1 ? '⬇️ Downvoted' : '↔️ Unvoted'
  console.log(`${action} ${thingId}`)
}

async function search(
  query: string,
  config: Config,
  options: { subreddit?: string; sort?: string; time?: string; limit?: number }
) {
  let endpoint = '/search'
  if (options.subreddit) {
    endpoint = `/r/${options.subreddit}/search?restrict_sr=on`
  }
  
  const params = new URLSearchParams({
    q: query,
    sort: options.sort || 'relevance',
    t: options.time || 'all',
    limit: (options.limit || 25).toString(),
  })
  
  const data = await apiRequest(`${endpoint}?${params}`, config)
  
  console.log(`\n🔍 Search: "${query}"\n`)
  
  for (const post of data.data.children) {
    const p = post.data
    const score = p.score.toString().padStart(5)
    console.log(`[${score}↑] ${p.title.slice(0, 60)}`)
    console.log(`   └─ r/${p.subreddit} | u/${p.author} | ${p.id}`)
  }
}

async function inbox(config: Config, unreadOnly = false) {
  const endpoint = unreadOnly ? '/message/unread' : '/message/inbox'
  const data = await apiRequest(endpoint, config)
  
  console.log(`\n📬 ${unreadOnly ? 'Unread' : 'Inbox'}\n`)
  
  for (const msg of data.data.children) {
    const m = msg.data
    const isNew = m.new ? '🔴' : '⚪'
    console.log(`${isNew} ${m.subject}`)
    console.log(`   From: u/${m.author} | ${m.subreddit ? `r/${m.subreddit}` : 'DM'}`)
    console.log(`   ${m.body.slice(0, 100)}...`)
    console.log()
  }
}

async function me(config: Config) {
  const data = await apiRequest('/api/v1/me', config)
  
  console.log(`\n👤 u/${data.name}`)
  console.log(`   Karma: ${data.link_karma} link | ${data.comment_karma} comment`)
  console.log(`   Created: ${new Date(data.created_utc * 1000).toLocaleDateString()}`)
  console.log(`   Verified: ${data.verified ? '✅' : '❌'}`)
}

async function user(username: string, config: Config) {
  const data = await apiRequest(`/user/${username}/about`, config)
  const u = data.data
  
  console.log(`\n👤 u/${u.name}`)
  console.log(`   Karma: ${u.link_karma} link | ${u.comment_karma} comment`)
  console.log(`   Created: ${new Date(u.created_utc * 1000).toLocaleDateString()}`)
}

// CLI
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const config = loadConfig()
  
  if (!config.redditSession && !config.tokenV2 && !config.accessToken) {
    console.error('❌ No Reddit credentials found.')
    console.error('   Add to TOOLS.md or set REDDIT_SESSION env var')
    process.exit(1)
  }
  
  try {
    switch (command) {
      case 'browse': {
        const sub = args[1] || 'all'
        const sortIdx = args.indexOf('--sort')
        const limitIdx = args.indexOf('--limit')
        const sort = sortIdx > -1 ? args[sortIdx + 1] : 'hot'
        const limit = limitIdx > -1 ? parseInt(args[limitIdx + 1]) : 25
        await browse(sub, sort, limit, config)
        break
      }
      
      case 'read': {
        await read(args[1], config)
        break
      }
      
      case 'post': {
        const sub = args[1]
        const titleIdx = args.indexOf('--title')
        const textIdx = args.indexOf('--text')
        const urlIdx = args.indexOf('--url')
        
        if (!sub || titleIdx === -1) {
          console.error('Usage: reddit post <subreddit> --title "Title" [--text "Body" | --url "URL"]')
          process.exit(1)
        }
        
        await post(sub, args[titleIdx + 1], config, {
          text: textIdx > -1 ? args[textIdx + 1] : undefined,
          url: urlIdx > -1 ? args[urlIdx + 1] : undefined,
        })
        break
      }
      
      case 'comment':
      case 'reply': {
        await comment(args[1], args.slice(2).join(' '), config)
        break
      }
      
      case 'upvote': {
        await vote(args[1], 1, config)
        break
      }
      
      case 'downvote': {
        await vote(args[1], -1, config)
        break
      }
      
      case 'search': {
        const query = args[1]
        const subIdx = args.indexOf('--subreddit')
        const sortIdx = args.indexOf('--sort')
        const timeIdx = args.indexOf('--time')
        
        await search(query, config, {
          subreddit: subIdx > -1 ? args[subIdx + 1] : undefined,
          sort: sortIdx > -1 ? args[sortIdx + 1] : undefined,
          time: timeIdx > -1 ? args[timeIdx + 1] : undefined,
        })
        break
      }
      
      case 'inbox': {
        const unread = args.includes('--unread')
        await inbox(config, unread)
        break
      }
      
      case 'me': {
        await me(config)
        break
      }
      
      case 'user': {
        await user(args[1], config)
        break
      }
      
      default:
        console.log(`
Reddit CLI - Act as a human user

Commands:
  browse <subreddit> [--sort hot|new|top] [--limit N]
  read <post_id_or_url>
  post <subreddit> --title "Title" [--text "Body" | --url "URL"]
  comment <post_id> <text>
  reply <comment_id> <text>
  upvote <id>
  downvote <id>
  search <query> [--subreddit X] [--sort relevance|top] [--time hour|day|week|month|year|all]
  inbox [--unread]
  me
  user <username>
`)
    }
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()
