import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const podcast_id = searchParams.get('podcast_id')

    if (!podcast_id) {
      return NextResponse.json({ error: 'Podcast ID parameter is required' }, { status: 400 })
    }

    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('podcast_id', podcast_id)
      .order('date_published', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching episodes:', error)
      return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 })
    }

    return NextResponse.json(episodes)
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
