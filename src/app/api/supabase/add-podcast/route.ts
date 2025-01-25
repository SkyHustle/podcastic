import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import chalk from 'chalk'
import { sanitizeHtml } from '@/lib/utils/html'
import type { PodcastInsert, EpisodeInsert } from '@/lib/schemas'

export async function POST(request: Request) {
  try {
    const { podcast, episodes } = await request.json()

    // Check if podcast already exists
    const { data: existingPodcast } = await supabase
      .from('podcasts')
      .select('*')
      .eq('feed_id', podcast.id.toString())
      .single()

    if (existingPodcast) {
      // Update the created_at timestamp to make it the latest podcast
      const { data: updatedPodcast, error: updateError } = await supabase
        .from('podcasts')
        .update({ created_at: new Date().toISOString() })
        .eq('id', existingPodcast.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update podcast' },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          source: 'database',
          podcast: updatedPodcast || existingPodcast,
        },
        { status: 200 },
      )
    }

    // Insert new podcast
    const start = Date.now()
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

    // Insert episodes
    const episodesToInsert: EpisodeInsert[] = episodes.map((item: any) => ({
      episode_guid: item.guid,
      podcast_id: insertedPodcast.id,
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
    }))

    const { error: episodesError } = await supabase
      .from('episodes')
      .upsert(episodesToInsert, { onConflict: 'episode_guid' })

    if (episodesError) {
      console.error('Failed to store episodes:', episodesError)
    }

    console.log(
      chalk.green(
        `Saved podcast and ${episodesToInsert.length} episodes to database in ${Date.now() - start}ms`,
      ),
    )

    // Enhanced podcast and episode summary
    console.log(chalk.blue('\n=== Podcast Summary ==='))
    console.log(chalk.green(`Title: ${podcast.title} by ${podcast.author}`))
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

    return NextResponse.json(
      {
        source: 'api',
        podcast: insertedPodcast,
      },
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
