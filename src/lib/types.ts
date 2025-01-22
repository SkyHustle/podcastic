import { z } from 'zod'

// Database Schemas
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

// Derived Types
export type Podcast = z.infer<typeof PodcastSchema>
export type PodcastInsert = Omit<Podcast, 'id' | 'created_at'>
export type TrendingPodcast = z.infer<typeof TrendingPodcastSchema>
export type TrendingPodcastInsert = Omit<TrendingPodcast, 'id' | 'created_at'>
