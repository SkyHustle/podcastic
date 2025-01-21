import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing env.SUPABASE_URL')
}
if (!process.env.SUPABASE_API_KEY) {
  throw new Error('Missing env.SUPABASE_API_KEY')
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY,
)

// Zod schema for runtime validation of podcast data
export const PodcastSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  podcast_guid: z.string(),
  title: z.string(),
  url: z.string().url(),
  original_url: z.string().nullable(),
  link: z.string().nullable(),
  description: z.string(),
  author: z.string(),
  image: z.string().url(),
  artwork: z.string().url(),
  itunes_id: z.number().nullable(),
  language: z.string(),
  categories: z.record(z.string(), z.string()),
  episode_count: z.number().default(0),
})

export const TrendingPodcastSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  podcast_id: z.number(),
  trend_score: z.number(),
  trending_at: z.string(),
})

export type Podcast = z.infer<typeof PodcastSchema>
export type PodcastInsert = Omit<Podcast, 'id' | 'created_at'>
export type TrendingPodcast = z.infer<typeof TrendingPodcastSchema>
export type TrendingPodcastInsert = Omit<TrendingPodcast, 'id' | 'created_at'>

export async function setupDatabase() {
  // Check if the table exists
  const { error } = await supabase.from('podcasts').select('id').limit(1)

  if (error?.code === 'PGRST204') {
    throw new Error(
      'Podcasts table does not exist. Please create the required tables first.',
    )
  } else if (error) {
    console.error('Error checking database:', error)
    throw error
  }
}
