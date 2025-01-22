import { NextResponse } from 'next/server'
import crypto from 'crypto'
import chalk from 'chalk'
import { supabase, type PodcastInsert } from '@/lib/supabase'
import { sanitizeHtml, PodcastIndexSchema } from '@/lib/podcast-index'

export async function GET(request: Request) {
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
    const { data: existingPodcast } = await supabase
      .from('podcasts')
      .select('*')
      .eq('podcast_guid', feed.id.toString())
      .single()

    if (existingPodcast) {
      return NextResponse.json({ podcast: existingPodcast })
    }

    // If not exists, insert the new podcast
    const podcastToInsert: PodcastInsert = {
      podcast_guid: feed.id.toString(),
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

    // Log the fetched podcast
    console.log('\n=== Podcast Fetched ===')
    console.log(
      chalk.green(`
Title: ${feed.title}
Author: ${feed.author}
Categories: ${Object.values(feed.categories).join(', ')}`),
    )
    console.log('=====================\n')

    return NextResponse.json({ podcast: insertedPodcast })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
