import { z } from 'zod'
// import { BasePodcastFields, EpisodeType, DateString } from './common-types'
import { BasePodcastFields } from './common-types'

// Database Schemas
export const PodcastSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  feed_id: z.string(),
  podcast_guid: z.string().nullable(),
  ...BasePodcastFields,
  url: z.string().url(),
  original_url: z.string().nullable(),
  owner_name: z.string().nullable(),
  artwork: z.string().url(),
  last_update_time: z.string().nullable(),
  last_crawl_time: z.string().nullable(),
  last_parse_time: z.string().nullable(),
  last_good_http_status_time: z.string().nullable(),
  last_http_status: z.number().nullable(),
  content_type: z.string().nullable(),
  itunes_id: z.number().nullable(),
  generator: z.string().nullable(),
  type: z
    .number()
    .nullable()
    .refine((val) => val === null || val === 0 || val === 1),
  medium: z.string().nullable(),
  dead: z.boolean().default(false),
  episode_count: z.number().default(0),
  crawl_errors: z.number().default(0),
  parse_errors: z.number().default(0),
  locked: z.boolean().default(false),
  image_url_hash: z.string().nullable(),
  newest_item_pubdate: z.string().nullable(),
})

// export const EpisodeSchema = z.object({
//   id: z.number(),
//   created_at: z.string(),
//   episode_guid: z.string(),
//   podcast_id: z.number(),
//   title: z.string(),
//   link: z.string().nullable(),
//   description: z.string(),
//   date_published: z.string(),
//   date_crawled: z.string().nullable(),
//   enclosure_url: z.string().url(),
//   enclosure_type: z.string(),
//   enclosure_length: z.number().nullable(),
//   duration: z.number().nullable(),
//   explicit: z.boolean().default(false),
//   episode_type: EpisodeType.nullable(),
//   episode_number: z.number().nullable(),
//   season: z.number().nullable(),
//   image: z.string().nullable(),
//   chapters_url: z.string().nullable(),
//   transcript_url: z.string().nullable(),
//   soundbite: z.unknown().nullable(),
//   soundbites: z.unknown().nullable(),
//   persons: z.unknown().nullable(),
//   social_interact: z.unknown().nullable(),
//   value: z.unknown().nullable(),
// })

// // Search result schemas
// export const PodcastSearchResultSchema = z.object({
//   id: z.number(),
//   title: z.string(),
//   author: z.string(),
//   description: z.string(),
//   rank: z.number(),
// })

// export const EpisodeSearchResultSchema = z.object({
//   id: z.number(),
//   podcast_id: z.number(),
//   title: z.string(),
//   description: z.string(),
//   date_published: z.string(),
//   rank: z.number(),
// })

// Derived Types
export type Podcast = z.infer<typeof PodcastSchema>
export type PodcastInsert = Omit<Podcast, 'id' | 'created_at'>
// export type Episode = z.infer<typeof EpisodeSchema>
// export type EpisodeInsert = Omit<Episode, 'id' | 'created_at'>
// export type PodcastSearchResult = z.infer<typeof PodcastSearchResultSchema>
// export type EpisodeSearchResult = z.infer<typeof EpisodeSearchResultSchema>
