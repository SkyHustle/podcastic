import { z } from 'zod'
// import { BasePodcastFields, EpisodeType } from './common-types'

// Base API response schema
const BaseApiResponse = {
  status: z.literal('true').or(z.literal(true)),
  count: z.number(),
  description: z.string(),
  status_code: z.number().optional(),
}

// Base media fields
export const BaseMediaFields = {
  title: z.string(),
  description: z.string(),
  link: z.string().url().nullable(),
  image: z.string().url(),
}

// Base podcast API response fields
export const BasePodcastFields = {
  ...BaseMediaFields,
  author: z.string(),
  language: z.string(),
  explicit: z
    .union([z.boolean(), z.number()])
    .transform((val) => (typeof val === 'number' ? Boolean(val) : val)),
  categories: z.record(z.string(), z.string()).default({}),
}

// Podcast feed from API
export const PodcastResponseSchema = z.object({
  ...BasePodcastFields,
  id: z.number(),
  url: z.string().url(),
  artwork: z.string().url(),
  ownerName: z.string().nullable().optional(),
  originalUrl: z.string().url().nullable().optional(),
  lastUpdateTime: z.number().nullable().optional(),
  lastCrawlTime: z.number().nullable().optional(),
  lastParseTime: z.number().nullable().optional(),
  lastGoodHttpStatusTime: z.number().nullable().optional(),
  lastHttpStatus: z.number().nullable().optional(),
  contentType: z.string().nullable().optional(),
  itunesId: z.number().nullable(),
  generator: z.string().nullable().optional(),
  type: z
    .union([z.literal(0), z.literal(1)])
    .nullable()
    .optional(),
  medium: z.string().nullable().optional(),
  dead: z.number().default(0),
  episodeCount: z.number().optional(),
  crawlErrors: z.number().default(0),
  parseErrors: z.number().default(0),
  locked: z.number().default(0),
  imageUrlHash: z.number().nullable().optional(),
  newestItemPubdate: z.number().nullable().optional(),
  trendScore: z.number().optional(),
  podcastGuid: z.string().optional(),
})

// // Episode from API
// export const PodcastEpisodeSchema = z.object({
//   id: z.number(),
//   title: z.string(),
//   link: z.string().url().nullable().optional(),
//   description: z.string(),
//   guid: z.string(),
//   datePublished: z.number(),
//   datePublishedPretty: z.string(),
//   dateCrawled: z.number().optional(),
//   enclosureUrl: z.string().url(),
//   enclosureType: z.string(),
//   enclosureLength: z.number().nullable().optional(),
//   duration: z.number().nullable().optional(),
//   explicit: z.number(),
//   episode: z.number().nullable().optional(),
//   episodeType: EpisodeType.nullable().optional(),
//   season: z.number().nullable().optional(),
//   image: z.string().url().nullable().optional().or(z.literal('')),
//   feedItunesId: z.number().nullable().optional(),
//   feedImage: z.string().url().nullable().optional(),
//   feedId: z.number(),
//   podcastGuid: z.string(),
//   chaptersUrl: z.string().url().nullable().optional(),
//   transcriptUrl: z.string().url().nullable().optional(),
//   soundbite: z.unknown().optional(),
//   soundbites: z.unknown().optional(),
//   persons: z.unknown().optional(),
//   socialInteract: z.unknown().optional(),
//   value: z.unknown().optional(),
// })

// // API Response Schemas
// export const PodcastSearchResponseSchema = z.object({
//   ...BaseApiResponse,
//   feeds: z.array(
//     PodcastRe.extend({
//       podcastGuid: z.string(),
//     }),
//   ),
// })

// Trending podcast from API
export const TrendingPodcastSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  title: z.string(),
  description: z.string(),
  author: z.string(),
  image: z.string().url(),
  artwork: z.string().url(),
  newestItemPublishTime: z.number(),
  itunesId: z.number().nullable(),
  trendScore: z.number(),
  language: z.string(),
  categories: z.record(z.string()), // Adjust based on actual categories structure
})

export const TrendingPodcastsResponseSchema = z.object({
  ...BaseApiResponse,
  feeds: z.array(TrendingPodcastSchema),
})

// export const PodcastEpisodesResponseSchema = z.object({
//   ...BaseApiResponse,
//   items: z.array(PodcastEpisodeSchema),
// })

// // Derived types
// export type PodcastFeed = z.infer<typeof PodcastRe>
// export type PodcastEpisode = z.infer<typeof PodcastEpisodeSchema>
export type PodcastSearchResponse = z.infer<typeof PodcastResponseSchema>
export type TrendingPodcastsResponse = z.infer<
  typeof TrendingPodcastsResponseSchema
>
// export type PodcastEpisodesResponse = z.infer<
//   typeof PodcastEpisodesResponseSchema
// >
