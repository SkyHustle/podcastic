import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import chalk from 'chalk'
import { sanitizeHtml } from '@/lib/utils/html'
import type { PodcastInsert } from '@/lib/schemas'

function transformPodcastForDb(podcast: any): PodcastInsert {
  return {
    feed_id: podcast.id.toString(),
    podcast_guid: podcast.podcastGuid ?? null,
    url: podcast.url,
    title: podcast.title,
    description: sanitizeHtml(podcast.description),
    author: podcast.author,
    owner_name: podcast.ownerName ?? null,
    original_url: podcast.originalUrl ?? null,
    link: podcast.link ?? null,
    image: podcast.image,
    artwork: podcast.artwork,
    last_update_time: podcast.lastUpdateTime
      ? new Date(podcast.lastUpdateTime * 1000).toISOString()
      : null,
    last_crawl_time: podcast.lastCrawlTime
      ? new Date(podcast.lastCrawlTime * 1000).toISOString()
      : null,
    last_parse_time: podcast.lastParseTime
      ? new Date(podcast.lastParseTime * 1000).toISOString()
      : null,
    last_good_http_status_time: podcast.lastGoodHttpStatusTime
      ? new Date(podcast.lastGoodHttpStatusTime * 1000).toISOString()
      : null,
    last_http_status: podcast.lastHttpStatus ?? null,
    content_type: podcast.contentType ?? null,
    itunes_id: podcast.itunesId,
    generator: podcast.generator ?? null,
    language: podcast.language,
    explicit: podcast.explicit === 1,
    type: podcast.type === 0 || podcast.type === 1 ? podcast.type : null,
    medium: podcast.medium ?? null,
    dead: podcast.dead === 1,
    episode_count: podcast.episodeCount ?? 0,
    crawl_errors: podcast.crawlErrors ?? 0,
    parse_errors: podcast.parseErrors ?? 0,
    categories: podcast.categories,
    locked: podcast.locked === 1,
    image_url_hash: podcast.imageUrlHash?.toString() ?? null,
    newest_item_pubdate: podcast.newestItemPubdate
      ? new Date(podcast.newestItemPubdate * 1000).toISOString()
      : null,
  }
}

export async function POST(request: Request) {
  try {
    const { podcast } = await request.json()

    // Check if podcast exists first
    const { data: existingPodcast } = await supabase
      .from('podcasts')
      .select('*')
      .eq('feed_id', podcast.id.toString())
      .single()

    if (existingPodcast) {
      console.log(chalk.blue(`Found existing podcast: ${podcast.title}`))
      return NextResponse.json(
        { source: 'database', podcast: existingPodcast },
        { status: 200 },
      )
    }

    // If podcast doesn't exist, insert it
    const podcastToInsert = transformPodcastForDb(podcast)
    const { data: insertedPodcast, error: insertError } = await supabase
      .from('podcasts')
      .insert(podcastToInsert)
      .select()
      .single()

    if (insertError) {
      console.error('Failed to store podcast:', insertError)
      return NextResponse.json(
        { error: 'Failed to store podcast' },
        { status: 500 },
      )
    }

    console.log(chalk.green(`Added new podcast: ${podcast.title}`))
    return NextResponse.json(
      { source: 'api', podcast: insertedPodcast },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error saving podcast:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
