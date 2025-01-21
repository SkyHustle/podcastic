import { NextResponse } from 'next/server'
import crypto from 'crypto'
import chalk from 'chalk'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { supabase, type PodcastInsert, setupDatabase } from '@/lib/supabase'

const prettyPrint = (obj: any): void => {
  console.log(chalk.green(JSON.stringify(obj, null, 2)))
}

// Configure DOMPurify to only allow basic formatting tags
const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

const PodcastIndexSchema = z.object({
  status: z.literal('true').or(z.literal(true)),
  feeds: z.array(
    z.object({
      id: z.number(),
      url: z.string().url(),
      title: z.string(),
      description: z.string(),
      author: z.string(),
      image: z.string().url(),
      artwork: z.string().url(),
      newestItemPublishTime: z.number(),
      itunesId: z.number().nullable(),
      trendScore: z.number(),
      language: z.string(),
      categories: z.record(z.string(), z.string()),
    }),
  ),
  count: z.number(),
  description: z.string(),
  status_code: z.number().optional(),
})

export async function GET() {
  try {
    // Ensure database is setup
    await setupDatabase()

    const apiKey = process.env.PODCAST_INDEX_API_KEY?.trim()
    const apiSecret = process.env.PODCAST_INDEX_API_SECRET?.trim()

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    const apiHeaderTime = Math.floor(Date.now() / 1000)
    const hash = crypto
      .createHash('sha1')
      .update(apiKey + apiSecret + apiHeaderTime)
      .digest('hex')

    const response = await fetch(
      'https://api.podcastindex.org/api/1.0/podcasts/trending?' +
        new URLSearchParams({
          max: '30',
          lang: 'en',
          cat: '9,11,12,102,112',
          pretty: 'true',
        }),
      {
        headers: {
          'User-Agent': 'PodAI/1.0',
          'X-Auth-Date': apiHeaderTime.toString(),
          'X-Auth-Key': apiKey,
          Authorization: hash,
        },
      },
    )

    const data = await response.json()
    const validated = PodcastIndexSchema.safeParse(data)

    if (!validated.success) {
      console.log('Validation Error:', validated.error)

      // Log the problematic feed
      const errorPath = validated.error.errors[0].path
      const feedIndex = errorPath[1] // Gets the index from ['feeds', index, 'fieldName']
      console.log('\nProblematic Feed Data:')
      console.log('Feed Index:', feedIndex)
      console.log('Feed:', data.feeds[feedIndex])
      console.log('\nSpecific field with error:', errorPath[2])
      console.log('Field value:', data.feeds[feedIndex][errorPath[2]])

      return NextResponse.json(
        { error: validated.error.errors },
        { status: 400 },
      )
    }

    console.log('\n=== API Response ===')
    prettyPrint(validated.data)
    console.log('==================\n')

    // Transform and store podcasts in Supabase
    const podcastsToInsert: PodcastInsert[] = validated.data.feeds.map(
      (feed) => ({
        url: feed.url,
        title: feed.title,
        description: sanitizeHtml(feed.description),
        author: feed.author,
        image_url: feed.image,
        artwork_url: feed.artwork,
        newest_item_publish_time: feed.newestItemPublishTime,
        itunes_id: feed.itunesId,
        trend_score: feed.trendScore,
        language: feed.language,
        categories: feed.categories,
      }),
    )

    // Upsert podcasts based on URL to avoid duplicates
    const { error } = await supabase
      .from('podcasts')
      .upsert(podcastsToInsert, { onConflict: 'url' })

    if (error) {
      console.error('Supabase Error:', error)
      return NextResponse.json(
        { error: 'Failed to store podcasts' },
        { status: 500 },
      )
    }

    return NextResponse.json(validated.data)
  } catch (error) {
    console.log('\nError:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
