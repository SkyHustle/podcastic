import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import chalk from 'chalk'
import { PodcastSchema } from '@/lib/schemas/db-schemas'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Podcast ID is required' }, { status: 400 })
    }

    const { data: podcast, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to fetch podcast:', error)
      return NextResponse.json({ error: 'Failed to fetch podcast' }, { status: 500 })
    }

    if (!podcast) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 })
    }

    // Validate the podcast data against our schema
    const validated = PodcastSchema.safeParse(podcast)

    if (!validated.success) {
      console.error('Podcast validation errors:', JSON.stringify(validated.error.errors, null, 2))
      return NextResponse.json({ error: 'Invalid podcast data structure' }, { status: 500 })
    }

    console.log(chalk.blue(`Fetched podcast: ${podcast.title}`))
    return NextResponse.json(validated.data)
  } catch (error) {
    console.error('Error fetching podcast:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
