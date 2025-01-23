import { NextResponse } from 'next/server'
import crypto from 'crypto'
import chalk from 'chalk'
import {
  supabase,
  type Podcast,
  type PodcastInsert,
  type TrendingPodcastInsert,
} from '@/lib/supabase'
import {
  sanitizeHtml,
  PodcastIndexSchema,
  PodcastEpisodesSchema,
  TrendingPodcastsSchema,
} from '@/lib/podcast-index'
import type { EpisodeInsert } from '@/lib/types'

async function fetchPodcastEpisodes(
  feedId: number,
  apiKey: string,
  apiSecret: string,
) {
  const start = Date.now()
  const apiHeaderTime = Math.floor(Date.now() / 1000)
  const hash = crypto
    .createHash('sha1')
    .update(apiKey + apiSecret + apiHeaderTime)
    .digest('hex')

  const response = await fetch(
    'https://api.podcastindex.org/api/1.0/episodes/byfeedid?' +
      new URLSearchParams({
        id: feedId.toString(),
        max: '5', // Get latest 10 episodes
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
  const result = PodcastEpisodesSchema.safeParse(data)
  return result
}

async function fetchPodcastDetails(
  feedId: number,
  apiKey: string,
  apiSecret: string,
) {
  const apiHeaderTime = Math.floor(Date.now() / 1000)
  const hash = crypto
    .createHash('sha1')
    .update(apiKey + apiSecret + apiHeaderTime)
    .digest('hex')

  const response = await fetch(
    'https://api.podcastindex.org/api/1.0/podcasts/byfeedid?' +
      new URLSearchParams({
        id: feedId.toString(),
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
  return data.feed?.episodeCount || 0
}

export async function GET() {
  const totalStart = Date.now()
  try {
    const apiKey = process.env.PODCAST_INDEX_API_KEY?.trim()
    const apiSecret = process.env.PODCAST_INDEX_API_SECRET?.trim()

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    const trendingStart = Date.now()
    const apiHeaderTime = Math.floor(Date.now() / 1000)
    const hash = crypto
      .createHash('sha1')
      .update(apiKey + apiSecret + apiHeaderTime)
      .digest('hex')

    const response = await fetch(
      'https://api.podcastindex.org/api/1.0/podcasts/trending?' +
        new URLSearchParams({
          max: '5',
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

    // Debug log the raw feed data
    console.log(
      chalk.yellow('\nRaw feed data sample:'),
      JSON.stringify(data.feeds?.[0], null, 2),
    )

    console.log(
      chalk.blue(
        `\n=== Trending Podcasts (${Date.now() - trendingStart}ms) ===`,
      ),
    )
    data.feeds?.forEach((feed: any, index: number) => {
      const count = feed.episodes || feed.episodeCount || 0
      console.log(
        chalk.green(
          `${index + 1}. ${feed.title} by ${feed.author} (${count} episodes)`,
        ),
      )
    })
    console.log(chalk.blue('=====================\n'))

    const validated = TrendingPodcastsSchema.safeParse(data)

    if (!validated.success) {
      console.error(
        'Validation Errors:',
        JSON.stringify(validated.error.format(), null, 2),
      )
      return NextResponse.json(
        { error: validated.error.errors },
        { status: 400 },
      )
    }

    // Transform and store the podcasts
    const podcastStart = Date.now()
    console.log(chalk.blue('\n=== Fetching Podcast Details ==='))
    const podcastsToInsert: PodcastInsert[] = []

    for (const feed of validated.data.feeds) {
      const episodeCount = await fetchPodcastDetails(feed.id, apiKey, apiSecret)
      console.log(
        chalk.green(`✓ ${feed.title}: ${episodeCount} total episodes`),
      )

      podcastsToInsert.push({
        feed_id: feed.id.toString(),
        url: feed.url,
        title: feed.title,
        description: sanitizeHtml(feed.description),
        author: feed.author,
        original_url: feed.originalUrl ?? null,
        link: feed.link ?? null,
        image: feed.image,
        artwork: feed.artwork,
        itunes_id: feed.itunesId,
        language: feed.language,
        categories: feed.categories,
        episode_count: episodeCount,
      })
    }

    // Upsert podcasts and get their IDs back
    const { data: insertedPodcasts, error: podcastError } = await supabase
      .from('podcasts')
      .upsert(podcastsToInsert, { onConflict: 'feed_id' })
      .select('*') // Get all fields including id
    console.log(chalk.blue(`Stored podcasts in ${Date.now() - podcastStart}ms`))

    if (podcastError || !insertedPodcasts) {
      return NextResponse.json(
        { error: 'Failed to store podcasts' },
        { status: 500 },
      )
    }

    // Create a map of feed_id to our internal podcast id for quick lookup
    const podcastIdMap = new Map(insertedPodcasts.map((p) => [p.feed_id, p.id]))

    // Create/update trending references using our internal IDs
    const trendingStoreStart = Date.now()
    const trendingToInsert: TrendingPodcastInsert[] = validated.data.feeds.map(
      (feed) => {
        const podcastId = podcastIdMap.get(feed.id.toString())
        if (!podcastId) {
          throw new Error(`No podcast ID found for feed ${feed.id}`)
        }
        return {
          podcast_id: podcastId,
          trend_score: feed.trendScore ?? 0,
          trending_at: new Date().toISOString(),
        }
      },
    )

    const { error: trendingError } = await supabase
      .from('trending_podcasts')
      .upsert(trendingToInsert, {
        onConflict: 'podcast_id,trending_at',
      })
    console.log(
      chalk.blue(
        `Stored trending data in ${Date.now() - trendingStoreStart}ms`,
      ),
    )

    if (trendingError) {
      return NextResponse.json(
        { error: 'Failed to store trending data' },
        { status: 500 },
      )
    }

    // Fetch and store episodes for each podcast
    console.log(chalk.blue('\n=== Fetching Episodes ==='))
    for (const feed of validated.data.feeds) {
      const episodesResult = await fetchPodcastEpisodes(
        feed.id,
        apiKey,
        apiSecret,
      )

      if (!episodesResult.success) {
        console.error(
          chalk.red(`❌ Failed to fetch episodes for "${feed.title}"`),
        )
        continue
      }

      const podcastId = podcastIdMap.get(feed.id.toString())
      if (!podcastId) {
        console.error(chalk.red(`❌ No podcast ID found for "${feed.title}"`))
        continue
      }

      const episodeStart = Date.now()
      const episodesToInsert: EpisodeInsert[] = episodesResult.data.items.map(
        (item) => ({
          episode_guid: item.guid,
          feed_id: feed.id.toString(),
          podcast_id: podcastId,
          title: item.title,
          description: sanitizeHtml(item.description),
          link: item.link ?? null,
          date_published: new Date(item.datePublished * 1000).toISOString(),
          enclosure_url: item.enclosureUrl,
          enclosure_type: item.enclosureType,
          enclosure_length: item.enclosureLength ?? null,
          duration: item.duration ?? null,
          image: item.image && item.image !== '' ? item.image : null,
          explicit: item.explicit === 1,
          episode_type: item.episodeType ?? null,
          season: item.season ?? null,
          episode_number: item.episode ?? null,
          chapters_url: item.chaptersUrl ?? null,
          transcript_url: item.transcriptUrl ?? null,
        }),
      )

      const { error: episodesError } = await supabase
        .from('episodes')
        .upsert(episodesToInsert, { onConflict: 'episode_guid' })

      if (episodesError) {
        console.error(
          chalk.red(`❌ Failed to store episodes for "${feed.title}"`),
        )
      } else {
        console.log(
          chalk.green(
            `✓ ${feed.title}: ${episodesToInsert.length}/${feed.episodeCount || 0} episodes (${Date.now() - episodeStart}ms)`,
          ),
        )
      }
    }

    console.log(chalk.blue('\n=== Performance Summary ==='))
    console.log(chalk.green(`✓ API Request: ${trendingStart - totalStart}ms`))
    console.log(
      chalk.green(`✓ Database Operations: ${Date.now() - trendingStart}ms`),
    )
    console.log(chalk.green(`✓ Total Time: ${Date.now() - totalStart}ms`))
    console.log(chalk.blue('=====================\n'))

    return NextResponse.json(validated.data)
  } catch (error) {
    console.log(chalk.red(`Request failed after ${Date.now() - totalStart}ms`))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
