import { NextResponse } from 'next/server'
import { z } from 'zod'
import { type EpisodeInsert } from '@/lib/schemas'
import chalk from 'chalk'
import { supabase } from '@/lib/supabase'

// Schema for the request body
const AddEpisodesRequestSchema = z.object({
  episodes: z.array(
    z.object({
      guid: z.string(),
      title: z.string(),
      link: z.union([z.string().url(), z.string().length(0), z.null()]).optional(),
      description: z.string(),
      datePublished: z.number(),
      enclosureUrl: z.string().url(),
      enclosureType: z.string(),
      enclosureLength: z.number().nullable().optional(),
      duration: z.number().nullable().optional(),
      explicit: z.number(),
      episode: z.number().nullable().optional(),
      episodeType: z.enum(['full', 'trailer', 'bonus']).nullable().optional(),
      season: z.number().nullable().optional(),
      image: z.string().url().nullable().optional().or(z.literal('')),
      feedId: z.number(),
      podcastGuid: z.string(),
      chaptersUrl: z.string().url().nullable().optional(),
      transcriptUrl: z.string().url().nullable().optional(),
    }),
  ),
  podcast_id: z.number(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const validated = AddEpisodesRequestSchema.safeParse(json)

    if (!validated.success) {
      console.error('Validation errors:', JSON.stringify(validated.error.errors, null, 2))
      return NextResponse.json({ error: validated.error.errors }, { status: 400 })
    }

    const { episodes, podcast_id } = validated.data
    const start = Date.now()

    // Convert API episodes to database format
    const dbEpisodes: EpisodeInsert[] = episodes.map((episode) => ({
      episode_guid: episode.guid,
      podcast_id,
      feed_id: episode.feedId,
      title: episode.title,
      link: episode.link || null,
      description: episode.description,
      date_published: new Date(episode.datePublished * 1000).toISOString(),
      date_crawled: new Date().toISOString(),
      enclosure_url: episode.enclosureUrl,
      enclosure_type: episode.enclosureType,
      enclosure_length: episode.enclosureLength || null,
      duration: episode.duration || null,
      explicit: episode.explicit === 1,
      episode_type: episode.episodeType || null,
      episode_number: episode.episode || null,
      season: episode.season || null,
      image: episode.image || null,
      chapters_url: episode.chaptersUrl || null,
      transcript_url: episode.transcriptUrl || null,
    }))

    // Upsert episodes and return the results
    const { data: savedEpisodes, error } = await supabase
      .from('episodes')
      .upsert(dbEpisodes, {
        onConflict: 'episode_guid',
        ignoreDuplicates: false,
      })
      .select()
      .order('date_published', { ascending: false })

    if (error) {
      console.error('Error upserting episodes:', error)
      return NextResponse.json({ error: 'Failed to save episodes' }, { status: 500 })
    }

    console.log(chalk.green(`Saved ${dbEpisodes.length} episodes in ${Date.now() - start}ms`))

    return NextResponse.json(savedEpisodes)
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
