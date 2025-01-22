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
  podcastGuid: string,
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
    'https://api.podcastindex.org/api/1.0/episodes/bypodcastguid?' +
      new URLSearchParams({
        guid: podcastGuid,
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
      return NextResponse.json(
        { error: validated.error.errors },
        { status: 400 },
      )
    }

    if (validated.data.feeds.length === 0) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 })
    }

    // Take the first result as it's most likely the exact match
    const feed = validated.data.feeds[0]

    // Check if podcast already exists in our database
    const dbStart = Date.now()
    const { data: existingPodcast } = await supabase
      .from('podcasts')
      .select('*')
      .eq('podcast_guid', feed.podcastGuid)
      .single()
    console.log(chalk.blue(`Database check in ${Date.now() - dbStart}ms`))

    let podcast = existingPodcast
    let source = 'database'

    if (!existingPodcast) {
      // If not exists, insert the new podcast
      const insertStart = Date.now()
      const podcastToInsert: PodcastInsert = {
        podcast_guid: feed.podcastGuid,
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
        episode_count: feed.episodeCount ?? 0,
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

    // Fetch episodes
    const episodesResult = await fetchPodcastEpisodes(
      feed.podcastGuid,
      apiKey,
      apiSecret,
    )

    if (!episodesResult.success) {
      console.error('Failed to validate episodes:', episodesResult.error)
    } else {
      // Insert episodes
      const episodeStart = Date.now()
      const episodesToInsert: EpisodeInsert[] = episodesResult.data.items.map(
        (item) => ({
          episode_guid: item.guid,
          podcast_guid: feed.podcastGuid,
          title: item.title,
          description: sanitizeHtml(item.description),
          link: item.link ?? null,
          date_published: new Date(item.datePublished * 1000).toISOString(),
          enclosure_url: item.enclosureUrl,
          enclosure_type: item.enclosureType,
          enclosure_length: item.enclosureLength ?? null,
          duration: item.duration ?? null,
          image: item.image ?? null,
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
        console.error('Failed to store episodes:', episodesError)
      }
      console.log(
        chalk.blue(`Stored episodes in ${Date.now() - episodeStart}ms`),
      )

      // Log the fetched podcast and episodes
      console.log('\n=== Podcast Fetched ===')
      console.log(
        chalk.green(`
Title: ${feed.title}
Author: ${feed.author}
Categories: ${Object.values(feed.categories).join(', ')}`),
      )

      console.log('\n=== Latest Episodes ===')
      episodesResult.data.items.forEach((episode, index) => {
        console.log(
          chalk.green(`
${index + 1}. ${episode.title}
   Published: ${episode.datePublishedPretty}
   Transcript: ${episode.transcriptUrl || 'None'}`),
        )
      })
      console.log('\n=====================\n')
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
