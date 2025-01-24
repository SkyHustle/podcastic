import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import chalk from 'chalk'
import type { TrendingPodcastInsert } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { trendingPodcasts } = await request.json()
    const start = Date.now()

    // Step 1: Delete all existing trending podcasts
    const { error: deleteError } = await supabase
      .from('trending_podcasts')
      .delete()
      .neq('id', 0) // Dummy condition to delete all rows

    if (deleteError) {
      console.error('Failed to clear trending podcasts:', deleteError)
      return NextResponse.json(
        { error: 'Failed to clear trending podcasts' },
        { status: 500 },
      )
    }

    // Step 2: Save each trending podcast
    const trendingToInsert: TrendingPodcastInsert[] = trendingPodcasts.map(
      (item: { podcast: { id: number }; trendScore: number }) => ({
        podcast_id: item.podcast.id,
        trend_score: item.trendScore,
        trending_at: new Date().toISOString(),
      }),
    )

    const { error: insertError } = await supabase
      .from('trending_podcasts')
      .insert(trendingToInsert)

    if (insertError) {
      console.error('Failed to insert trending podcasts:', insertError)
      return NextResponse.json(
        { error: 'Failed to insert trending podcasts' },
        { status: 500 },
      )
    }

    console.log(
      chalk.green(
        `Saved ${trendingToInsert.length} trending podcasts in ${Date.now() - start}ms`,
      ),
    )

    return NextResponse.json(
      { message: 'Trending podcasts updated successfully' },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error saving trending podcasts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
