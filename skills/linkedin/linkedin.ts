#!/usr/bin/env npx ts-node
/**
 * LinkedIn CLI - Act as a human user via session cookies
 * Usage: linkedin <command> [options]
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const BASE_URL = 'https://www.linkedin.com'
const API_URL = 'https://www.linkedin.com/voyager/api'
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface Config {
  liAt?: string
  jsessionId?: string
}

function loadConfig(): Config {
  const toolsPath = join(process.env.HOME || '', 'clawd', 'TOOLS.md')
  if (existsSync(toolsPath)) {
    const content = readFileSync(toolsPath, 'utf-8')
    const liAtMatch = content.match(/li_at:\s*`([^`]+)`/)
    const jsessionMatch = content.match(/JSESSIONID:\s*`([^`]+)`/)
    return {
      liAt: liAtMatch?.[1] || process.env.LINKEDIN_LI_AT,
      jsessionId: jsessionMatch?.[1] || process.env.LINKEDIN_JSESSIONID,
    }
  }
  return {
    liAt: process.env.LINKEDIN_LI_AT,
    jsessionId: process.env.LINKEDIN_JSESSIONID,
  }
}

function getCookies(config: Config): string {
  const cookies: string[] = []
  if (config.liAt) cookies.push(`li_at=${config.liAt}`)
  if (config.jsessionId) cookies.push(`JSESSIONID=${config.jsessionId}`)
  return cookies.join('; ')
}

async function apiRequest(
  endpoint: string,
  config: Config,
  options: RequestInit = {}
): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`
  
  const csrfToken = config.jsessionId?.replace(/"/g, '') || ''
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/vnd.linkedin.normalized+json+2.1',
      'Cookie': getCookies(config),
      'csrf-token': csrfToken,
      'x-li-lang': 'en_US',
      'x-restli-protocol-version': '2.0.0',
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`LinkedIn API error ${response.status}: ${text.slice(0, 200)}`)
  }
  
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text)
}

async function me(config: Config) {
  const data = await apiRequest('/me', config)
  
  const profile = data.data || data
  console.log(`\n👤 ${profile.firstName} ${profile.lastName}`)
  console.log(`   Headline: ${profile.headline || 'N/A'}`)
  console.log(`   Location: ${profile.geoLocationName || 'N/A'}`)
  console.log(`   ID: ${profile.entityUrn || profile.publicIdentifier}`)
}

async function profile(identifier: string, config: Config) {
  // Handle URLs
  const username = identifier
    .replace('https://www.linkedin.com/in/', '')
    .replace('https://linkedin.com/in/', '')
    .replace(/\/$/, '')
  
  const data = await apiRequest(`/identity/profiles/${username}`, config)
  
  const p = data.data || data
  console.log(`\n👤 ${p.firstName} ${p.lastName}`)
  console.log(`   ${p.headline || ''}`)
  console.log(`   📍 ${p.geoLocationName || 'Unknown'}`)
  console.log(`   🔗 linkedin.com/in/${p.publicIdentifier}`)
}

async function feed(limit: number, config: Config) {
  const data = await apiRequest(
    `/feed/updatesV2?count=${limit}&q=relevance&sortBy=RELEVANCE`,
    config
  )
  
  console.log('\n📰 Your Feed\n')
  
  const elements = data.included || data.elements || []
  
  for (const item of elements) {
    if (item.$type !== 'com.linkedin.voyager.feed.render.UpdateV2') continue
    
    const actor = item.actor?.name?.text || 'Unknown'
    const commentary = item.commentary?.text?.text || item.resharedUpdate?.commentary?.text?.text || ''
    const urn = item.socialDetail?.urn || item.urn || ''
    
    if (!commentary) continue
    
    console.log(`👤 ${actor}`)
    console.log(`   ${commentary.slice(0, 150)}${commentary.length > 150 ? '...' : ''}`)
    console.log(`   URN: ${urn}`)
    console.log()
  }
}

async function post(content: string, config: Config, options: { image?: string; article?: string } = {}) {
  // Create a share
  const shareBody = {
    author: '', // Will be filled by API
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }
  
  if (options.article) {
    shareBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE'
    shareBody.specificContent['com.linkedin.ugc.ShareContent'].media = [{
      status: 'READY',
      originalUrl: options.article,
    }]
  }
  
  // LinkedIn's posting API is complex - use the simpler share endpoint
  const result = await apiRequest('/shares', config, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      commentary: content,
      visibility: 'ANYONE',
    }),
  })
  
  console.log('✅ Posted successfully!')
  console.log(`   ${result?.value || 'Check your profile'}`)
}

async function comment(postUrn: string, text: string, config: Config) {
  const body = {
    threadUrn: postUrn,
    message: { text },
  }
  
  await apiRequest('/socialActions/comments', config, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  
  console.log('✅ Comment posted!')
}

async function like(postUrn: string, config: Config) {
  await apiRequest(`/socialActions/${encodeURIComponent(postUrn)}/like`, config, {
    method: 'POST',
  })
  
  console.log('✅ Liked!')
}

async function search(query: string, limit: number, config: Config) {
  const params = new URLSearchParams({
    keywords: query,
    count: limit.toString(),
    start: '0',
  })
  
  const data = await apiRequest(`/search/blended?${params}`, config)
  
  console.log(`\n🔍 Search: "${query}"\n`)
  
  const elements = data.included || data.elements || []
  
  for (const item of elements) {
    if (item.$type !== 'com.linkedin.voyager.search.SearchProfile') continue
    
    console.log(`👤 ${item.title?.text || 'Unknown'}`)
    console.log(`   ${item.headline?.text || ''}`)
    console.log(`   ${item.subline?.text || ''}`)
    console.log()
  }
}

async function connect(profileId: string, message: string, config: Config) {
  const body = {
    trackingId: Buffer.from(Date.now().toString()).toString('base64'),
    message: message || undefined,
    inviteeProfileId: profileId,
  }
  
  await apiRequest('/relationships/invitations', config, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  
  console.log('✅ Connection request sent!')
}

async function message(profileId: string, text: string, config: Config) {
  // First get/create conversation
  const convBody = {
    recipients: [profileId],
    subtype: 'MEMBER_TO_MEMBER',
  }
  
  // This is simplified - LinkedIn messaging is complex
  console.log('⚠️ Messaging requires conversation lookup - use LinkedIn directly for now')
  console.log(`   Would message ${profileId}: ${text.slice(0, 50)}...`)
}

// CLI
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const config = loadConfig()
  
  if (!config.liAt) {
    console.error('❌ No LinkedIn credentials found.')
    console.error('   Add li_at and JSESSIONID to TOOLS.md or set LINKEDIN_LI_AT env var')
    process.exit(1)
  }
  
  try {
    switch (command) {
      case 'me':
        await me(config)
        break
        
      case 'profile':
        await profile(args[1], config)
        break
        
      case 'feed': {
        const limitIdx = args.indexOf('--limit')
        const limit = limitIdx > -1 ? parseInt(args[limitIdx + 1]) : 20
        await feed(limit, config)
        break
      }
        
      case 'post': {
        const text = args[1]
        const imageIdx = args.indexOf('--image')
        const articleIdx = args.indexOf('--article')
        await post(text, config, {
          image: imageIdx > -1 ? args[imageIdx + 1] : undefined,
          article: articleIdx > -1 ? args[articleIdx + 1] : undefined,
        })
        break
      }
        
      case 'comment':
        await comment(args[1], args.slice(2).join(' '), config)
        break
        
      case 'like':
        await like(args[1], config)
        break
        
      case 'search': {
        const limitIdx = args.indexOf('--limit')
        const limit = limitIdx > -1 ? parseInt(args[limitIdx + 1]) : 25
        const query = args.slice(1).filter(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--limit').join(' ')
        await search(query, limit, config)
        break
      }
        
      case 'connect':
        await connect(args[1], args.slice(2).join(' '), config)
        break
        
      case 'message':
        await message(args[1], args.slice(2).join(' '), config)
        break
        
      default:
        console.log(`
LinkedIn CLI - Act as a human user

Commands:
  me                                   View your profile
  profile <username_or_url>            View someone's profile
  feed [--limit N]                     View your feed
  post "<text>" [--article URL]        Post an update
  comment <post_urn> <text>            Comment on a post
  like <post_urn>                      Like a post
  search "<query>" [--limit N]         Search people
  connect <profile_id> [message]       Send connection request
  message <profile_id> <text>          Send a message
`)
    }
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()
