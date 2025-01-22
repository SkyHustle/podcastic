import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import chalk from 'chalk'
import {
  supabase,
  type Podcast,
  type PodcastInsert,
  type TrendingPodcastInsert,
} from '@/lib/supabase'

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
          max: '10',
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
      return NextResponse.json(
        { error: validated.error.errors },
        { status: 400 },
      )
    }

    // Transform and store the podcasts
    const podcastsToInsert: PodcastInsert[] = validated.data.feeds.map(
      (feed) => ({
        podcast_guid: feed.id.toString(),
        url: feed.url,
        title: feed.title,
        description: sanitizeHtml(feed.description),
        author: feed.author,
        original_url: null,
        link: null,
        image: feed.image,
        artwork: feed.artwork,
        itunes_id: feed.itunesId,
        language: feed.language,
        categories: feed.categories,
        episode_count: 0,
      }),
    )

    // Upsert podcasts based on podcast_guid
    const { data: insertedPodcasts, error: podcastError } = await supabase
      .from('podcasts')
      .upsert(podcastsToInsert, { onConflict: 'podcast_guid' })
      .select()

    if (podcastError || !insertedPodcasts) {
      return NextResponse.json(
        { error: 'Failed to store podcasts' },
        { status: 500 },
      )
    }

    // Create/update trending references
    const trendingToInsert: TrendingPodcastInsert[] = insertedPodcasts.map(
      (podcast: Podcast, index: number) => ({
        podcast_id: podcast.id,
        trend_score: validated.data.feeds[index].trendScore,
        trending_at: new Date().toISOString(),
      }),
    )

    const { error: trendingError } = await supabase
      .from('trending_podcasts')
      .upsert(trendingToInsert, {
        onConflict: 'podcast_id,trending_at',
      })

    if (trendingError) {
      return NextResponse.json(
        { error: 'Failed to store trending data' },
        { status: 500 },
      )
    }

    // Log the fetched podcasts
    console.log('\n=== Trending Podcasts Fetched ===')
    validated.data.feeds.forEach((feed, index) => {
      console.log(
        chalk.green(`\n${index + 1}. Title: ${feed.title}
   Author: ${feed.author}
   Categories: ${Object.values(feed.categories).join(', ')}`),
      )
    })
    console.log('\n=============================\n')

    return NextResponse.json(validated.data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
