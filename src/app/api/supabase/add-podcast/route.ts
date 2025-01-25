import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import chalk from 'chalk'
import { sanitizeHtml } from '@/lib/utils/html'
import type { PodcastInsert } from '@/lib/schemas'

export async function POST(request: Request) {
  try {
    const { podcast } = await request.json()

    // Prepare podcast data for insertion/update
    const podcastToInsert: PodcastInsert = {
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

    // Upsert the podcast (insert if not exists, update if exists)
    const { data: upsertedPodcast, error: upsertError } = await supabase
      .from('podcasts')
      .upsert(podcastToInsert, {
        onConflict: 'feed_id',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Failed to store podcast:', upsertError)
      return NextResponse.json(
        { error: 'Failed to store podcast' },
        { status: 500 },
      )
    }

    console.log(chalk.green(`Saved podcast: ${podcast.title}`))
    return NextResponse.json(
      { source: 'api', podcast: upsertedPodcast },
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
