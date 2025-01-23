import { NextResponse } from 'next/server'
import crypto from 'crypto'
import chalk from 'chalk'
import {
  supabase,
  type PodcastInsert,
  type TrendingPodcastInsert,
} from '@/lib/supabase'
import {
  sanitizeHtml,
  PodcastEpisodesSchema,
  TrendingPodcastsSchema,
} from '@/lib/podcast-index'
import type { EpisodeInsert } from '@/lib/types'

// Commenting out episode fetching function as we're not using it for now
// async function fetchPodcastEpisodes(
//   feedId: number,
//   apiKey: string,
//   apiSecret: string,
// ) {
//   const apiHeaderTime = Math.floor(Date.now() / 1000)
//   const hash = crypto
//     .createHash('sha1')
//     .update(apiKey + apiSecret + apiHeaderTime)
//     .digest('hex')

//   const response = await fetch(
//     'https://api.podcastindex.org/api/1.0/episodes/byfeedid?' +
//       new URLSearchParams({
//         id: feedId.toString(),
//         max: '5',
//         pretty: 'true',
//       }),
//     {
//       headers: {
//         'User-Agent': 'PodAI/1.0',
//         'X-Auth-Date': apiHeaderTime.toString(),
//         'X-Auth-Key': apiKey,
//         Authorization: hash,
//       },
//     },
//   )

//   const data = await response.json()
//   return PodcastEpisodesSchema.safeParse(data)
// }

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

export async function GET() {
  const totalStart = Date.now()
  try {
    const apiKey = process.env.PODCAST_INDEX_API_KEY?.trim()
    const apiSecret = process.env.PODCAST_INDEX_API_SECRET?.trim()

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    // Fetch trending podcasts
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

    // Log trending podcasts
    console.log(
      chalk.blue(
        `\n=== Trending Podcasts (${Date.now() - trendingStart}ms) ===`,
      ),
    )
    data.feeds?.forEach((feed: any, index: number) => {
      console.log(chalk.green(`${index + 1}. ${feed.title} by ${feed.author}`))
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

    // Create a map of feed IDs to their trend scores
    const trendScores = new Map(
      validated.data.feeds.map((feed) => [feed.id, feed.trendScore ?? 0]),
    )

    // Fetch complete details for each trending podcast
    const detailsStart = Date.now()
    console.log(chalk.blue('\n=== Fetching Complete Podcast Details ==='))
    const detailsPromises = validated.data.feeds.map((feed) =>
      fetchPodcastDetails(feed.id, apiKey, apiSecret),
    )
    const podcastDetails = await Promise.all(detailsPromises)
    console.log(
      chalk.blue(`Fetched all details in ${Date.now() - detailsStart}ms`),
    )

    // Transform and store the podcasts with complete details
    const podcastStart = Date.now()
    const podcastsToInsert: PodcastInsert[] = podcastDetails.map((feed) => ({
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
    }))

    // Log the podcast details
    podcastsToInsert.forEach((podcast) => {
      console.log(
        chalk.green(
          `✓ ${podcast.title}: ${podcast.episode_count} total episodes`,
        ),
      )
    })

    // Store podcasts and get their IDs back
    const { data: insertedPodcasts, error: podcastError } = await supabase
      .from('podcasts')
      .upsert(podcastsToInsert, { onConflict: 'feed_id' })
      .select('*')
    console.log(chalk.blue(`Stored podcasts in ${Date.now() - podcastStart}ms`))

    if (podcastError || !insertedPodcasts) {
      return NextResponse.json(
        { error: 'Failed to store podcasts' },
        { status: 500 },
      )
    }

    // Create a map of feed_id to internal podcast id
    const podcastIdMap = new Map(insertedPodcasts.map((p) => [p.feed_id, p.id]))

    // Store trending data
    const trendingStoreStart = Date.now()
    const trendingToInsert: TrendingPodcastInsert[] = insertedPodcasts.map(
      (podcast) => ({
        podcast_id: podcast.id,
        trend_score: trendScores.get(parseInt(podcast.feed_id)) ?? 0,
        trending_at: new Date().toISOString(),
      }),
    )

    // First clear existing trending data
    await supabase.from('trending_podcasts').delete().neq('id', 0)

    // Then insert new trending data
    const { error: trendingError } = await supabase
      .from('trending_podcasts')
      .insert(trendingToInsert)

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

    // // Fetch and store episodes in parallel
    // console.log(chalk.blue('\n=== Fetching Episodes ==='))
    // const episodesStart = Date.now()
    // const episodePromises = validated.data.feeds.map((feed) =>
    //   fetchPodcastEpisodes(feed.id, apiKey, apiSecret),
    // )
    // const episodeResults = await Promise.all(episodePromises)

    // // Process episodes in parallel
    // const episodeInsertPromises = episodeResults.map(async (result, index) => {
    //   const feed = validated.data.feeds[index]
    //   if (!result.success) {
    //     console.error(
    //       chalk.red(`❌ Failed to fetch episodes for "${feed.title}"`),
    //     )
    //     return
    //   }

    //   const podcastId = podcastIdMap.get(feed.id.toString())
    //   if (!podcastId) {
    //     console.error(chalk.red(`❌ No podcast ID found for "${feed.title}"`))
    //     return
    //   }

    //   const episodesToInsert: EpisodeInsert[] = result.data.items.map(
    //     (item) => ({
    //       episode_guid: item.guid,
    //       podcast_id: podcastId,
    //       title: item.title,
    //       description: sanitizeHtml(item.description),
    //       link: item.link ?? null,
    //       date_published: new Date(item.datePublished * 1000).toISOString(),
    //       date_crawled: item.dateCrawled
    //         ? new Date(item.dateCrawled * 1000).toISOString()
    //         : null,
    //       enclosure_url: item.enclosureUrl,
    //       enclosure_type: item.enclosureType,
    //       enclosure_length: item.enclosureLength ?? null,
    //       duration: item.duration ?? null,
    //       image: item.image && item.image !== '' ? item.image : null,
    //       explicit: item.explicit === 1,
    //       episode_type: item.episodeType ?? null,
    //       season: item.season ?? null,
    //       episode_number: item.episode ?? null,
    //       chapters_url: item.chaptersUrl ?? null,
    //       transcript_url: item.transcriptUrl ?? null,
    //       soundbite: item.soundbite ?? null,
    //       soundbites: item.soundbites ?? null,
    //       persons: item.persons ?? null,
    //       social_interact: item.socialInteract ?? null,
    //       value: item.value ?? null,
    //     }),
    //   )

    //   const { error: episodesError } = await supabase
    //     .from('episodes')
    //     .upsert(episodesToInsert, { onConflict: 'episode_guid' })

    //   if (episodesError) {
    //     console.error(
    //       chalk.red(`❌ Failed to store episodes for "${feed.title}"`),
    //     )
    //   } else {
    //     console.log(
    //       chalk.green(
    //         `✓ ${feed.title}: ${episodesToInsert.length}/${episodeCounts[index]} episodes`,
    //       ),
    //     )
    //   }
    // })

    // await Promise.all(episodeInsertPromises)
    // console.log(
    //   chalk.blue(`Processed all episodes in ${Date.now() - episodesStart}ms`),
    // )

    // Performance summary
    console.log(chalk.blue('\n=== Performance Summary ==='))
    console.log(chalk.green(`✓ API Request: ${trendingStart - totalStart}ms`))
    console.log(
      chalk.green(`✓ Database Operations: ${Date.now() - trendingStart}ms`),
    )
    console.log(chalk.green(`✓ Total Time: ${Date.now() - totalStart}ms`))
    console.log(chalk.blue('=====================\n'))

    return NextResponse.json({
      feeds: podcastDetails,
      count: podcastDetails.length,
    })
  } catch (error) {
    console.log(chalk.red(`Request failed after ${Date.now() - totalStart}ms`))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
