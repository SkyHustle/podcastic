import { NextResponse } from 'next/server'
import crypto from 'crypto'
import chalk from 'chalk'
import { supabase, type PodcastInsert } from '@/lib/supabase'
import {
  sanitizeHtml,
  PodcastIndexSchema,
  PodcastEpisodesSchema,
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
        max: '10', // Get latest 10 episodes
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
  console.log(chalk.blue(`Fetched episodes in ${Date.now() - start}ms`))
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
  return data.feed
}

export async function GET(request: Request) {
  const totalStart = Date.now()
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')

    if (!title) {
      return NextResponse.json(
        { error: 'Title parameter is required' },
        { status: 400 },
      )
    }

    const apiKey = process.env.PODCAST_INDEX_API_KEY?.trim()
    const apiSecret = process.env.PODCAST_INDEX_API_SECRET?.trim()

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    const searchStart = Date.now()
    const apiHeaderTime = Math.floor(Date.now() / 1000)
    const hash = crypto
      .createHash('sha1')
      .update(apiKey + apiSecret + apiHeaderTime)
      .digest('hex')

    const response = await fetch(
      'https://api.podcastindex.org/api/1.0/search/bytitle?' +
        new URLSearchParams({
          q: title,
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
    console.log(chalk.blue(`Searched podcast in ${Date.now() - searchStart}ms`))

    const validated = PodcastIndexSchema.safeParse(data)

    if (!validated.success) {
      console.error(
        'Validation errors:',
        JSON.stringify(validated.error.errors, null, 2),
      )
      return NextResponse.json(
        { error: validated.error.errors },
        { status: 400 },
      )
    }

    if (validated.data.feeds.length === 0) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 })
    }

    // Take the first result as it's most likely the exact match
    const searchResult = validated.data.feeds[0]

    // Fetch complete podcast details
    console.log(chalk.blue('\n=== Fetching Complete Podcast Details ==='))
    const detailsStart = Date.now()
    const feed = await fetchPodcastDetails(searchResult.id, apiKey, apiSecret)
    console.log(chalk.blue(`Fetched details in ${Date.now() - detailsStart}ms`))

    // Check if podcast already exists in our database
    const dbStart = Date.now()
    const { data: existingPodcast } = await supabase
      .from('podcasts')
      .select('*')
      .eq('feed_id', feed.id.toString())
      .single()
    console.log(chalk.blue(`Database check in ${Date.now() - dbStart}ms`))

    let podcast = existingPodcast
    let source = 'database'

    if (!existingPodcast) {
      // If not exists, insert the new podcast with complete details
      const insertStart = Date.now()
      const podcastToInsert: PodcastInsert = {
        feed_id: feed.id.toString(),
        podcast_guid: feed.podcastGuid ?? null,
        url: feed.url,
        title: feed.title,
        description: sanitizeHtml(feed.description),
        author: feed.author,
        owner_name: feed.ownerName ?? null,
        original_url: feed.originalUrl ?? null,
        link: feed.link ?? null,
        image: feed.image,
        artwork: feed.artwork,
        last_update_time: feed.lastUpdateTime
          ? new Date(feed.lastUpdateTime * 1000).toISOString()
          : null,
        last_crawl_time: feed.lastCrawlTime
          ? new Date(feed.lastCrawlTime * 1000).toISOString()
          : null,
        last_parse_time: feed.lastParseTime
          ? new Date(feed.lastParseTime * 1000).toISOString()
          : null,
        last_good_http_status_time: feed.lastGoodHttpStatusTime
          ? new Date(feed.lastGoodHttpStatusTime * 1000).toISOString()
          : null,
        last_http_status: feed.lastHttpStatus ?? null,
        content_type: feed.contentType ?? null,
        itunes_id: feed.itunesId,
        generator: feed.generator ?? null,
        language: feed.language,
        explicit: feed.explicit === 1,
        type: feed.type === 0 || feed.type === 1 ? feed.type : null,
        medium: feed.medium ?? null,
        dead: feed.dead === 1,
        episode_count: feed.episodeCount ?? 0,
        crawl_errors: feed.crawlErrors ?? 0,
        parse_errors: feed.parseErrors ?? 0,
        categories: feed.categories,
        locked: feed.locked === 1,
        image_url_hash: feed.imageUrlHash?.toString() ?? null,
        newest_item_pubdate: feed.newestItemPubdate
          ? new Date(feed.newestItemPubdate * 1000).toISOString()
          : null,
      }

      const { data: insertedPodcast, error: insertError } = await supabase
        .from('podcasts')
        .insert(podcastToInsert)
        .select()
        .single()

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to store podcast' },
          { status: 500 },
        )
      }
      console.log(
        chalk.blue(`Inserted podcast in ${Date.now() - insertStart}ms`),
      )

      podcast = insertedPodcast
      source = 'api'
    }

    // Fetch episodes using feed ID
    const episodesResult = await fetchPodcastEpisodes(
      feed.id,
      apiKey,
      apiSecret,
    )

    if (!episodesResult.success) {
      console.error(
        chalk.red('Failed to validate episodes:'),
        episodesResult.error,
      )
    } else {
      // Insert episodes
      const episodeStart = Date.now()
      const episodesToInsert: EpisodeInsert[] = episodesResult.data.items.map(
        (item) => ({
          episode_guid: item.guid,
          podcast_id: podcast.id,
          title: item.title,
          description: sanitizeHtml(item.description),
          link: item.link ?? null,
          date_published: new Date(item.datePublished * 1000).toISOString(),
          date_crawled: item.dateCrawled
            ? new Date(item.dateCrawled * 1000).toISOString()
            : null,
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
          soundbite: item.soundbite ?? null,
          soundbites: item.soundbites ?? null,
          persons: item.persons ?? null,
          social_interact: item.socialInteract ?? null,
          value: item.value ?? null,
        }),
      )

      const { error: episodesError } = await supabase
        .from('episodes')
        .upsert(episodesToInsert, { onConflict: 'episode_guid' })

      if (episodesError) {
        console.error(chalk.red('Failed to store episodes:'), episodesError)
      } else {
        console.log(
          chalk.blue(
            `Stored ${episodesToInsert.length} episodes in ${Date.now() - episodeStart}ms`,
          ),
        )
      }

      // Enhanced podcast and episode summary
      console.log(chalk.blue('\n=== Podcast Summary ==='))
      console.log(chalk.green(`Title: ${feed.title} by ${feed.author}`))
      console.log(chalk.green(`Episodes Fetched: ${episodesToInsert.length}`))
      console.log(chalk.blue('\n=== Recent Episodes ==='))
      episodesToInsert.slice(0, 5).forEach((episode, index) => {
        console.log(chalk.green(`${index + 1}. ${episode.title}`))
        console.log(chalk.gray(`   Published: ${episode.date_published}`))
        console.log(
          chalk.gray(
            `   Duration: ${episode.duration ? Math.floor(episode.duration / 60) + ' minutes' : 'Unknown'}`,
          ),
        )
      })
      console.log(chalk.blue('=====================\n'))
    }

    console.log(chalk.blue(`Total request time: ${Date.now() - totalStart}ms`))

    return NextResponse.json({
      podcast,
      source,
      episodeCount: episodesResult.success ? episodesResult.data.count : 0,
    })
  } catch (error) {
    console.log(chalk.red(`Request failed after ${Date.now() - totalStart}ms`))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
