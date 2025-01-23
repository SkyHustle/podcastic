import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Configure DOMPurify to only allow basic formatting tags
export const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

// Base podcast feed schema
const BasePodcastFeedSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  title: z.string(),
  description: z.string(),
  author: z.string(),
  ownerName: z.string().nullable().optional(),
  image: z.string().url(),
  artwork: z.string().url(),
  link: z.string().url().nullable().optional(),
  originalUrl: z.string().url().nullable().optional(),
  lastUpdateTime: z.number().nullable().optional(),
  lastCrawlTime: z.number().nullable().optional(),
  lastParseTime: z.number().nullable().optional(),
  lastGoodHttpStatusTime: z.number().nullable().optional(),
  lastHttpStatus: z.number().nullable().optional(),
  contentType: z.string().nullable().optional(),
  itunesId: z.number().nullable(),
  generator: z.string().nullable().optional(),
  language: z.string(),
  explicit: z.union([z.number(), z.boolean()]).default(0),
  type: z
    .union([z.literal(0), z.literal(1)])
    .nullable()
    .optional(),
  medium: z.string().nullable().optional(),
  dead: z.number().default(0),
  episodeCount: z.number().optional(),
  crawlErrors: z.number().default(0),
  parseErrors: z.number().default(0),
  categories: z.record(z.string(), z.string()),
  locked: z.number().default(0),
  imageUrlHash: z.number().nullable().optional(),
  newestItemPubdate: z.number().nullable().optional(),
  trendScore: z.number().optional(),
  podcastGuid: z.string().optional(),
})

// Schema for podcast search API responses
export const PodcastIndexSchema = z.object({
  status: z.literal('true').or(z.literal(true)),
  feeds: z.array(
    BasePodcastFeedSchema.extend({
      podcastGuid: z.string(),
    }),
  ),
  count: z.number(),
  description: z.string(),
  status_code: z.number().optional(),
})

// Schema for trending podcasts API response
export const TrendingPodcastsSchema = z.object({
  status: z.literal('true').or(z.literal(true)),
  feeds: z.array(BasePodcastFeedSchema),
  count: z.number(),
  description: z.string(),
  status_code: z.number().optional(),
})

// Schema for podcast episodes API response
export const PodcastEpisodesSchema = z.object({
  status: z.literal('true').or(z.literal(true)),
  items: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      link: z.string().url().nullable().optional(),
      description: z.string(),
      guid: z.string(),
      datePublished: z.number(),
      datePublishedPretty: z.string(),
      dateCrawled: z.number().optional(),
      enclosureUrl: z.string().url(),
      enclosureType: z.string(),
      enclosureLength: z.number().nullable().optional(),
      duration: z.number().nullable().optional(),
      explicit: z.number(),
      episode: z.number().nullable().optional(),
      episodeType: z.enum(['full', 'trailer', 'bonus']).nullable().optional(),
      season: z.number().nullable().optional(),
      image: z.string().url().nullable().optional().or(z.literal('')),
      feedItunesId: z.number().nullable().optional(),
      feedImage: z.string().url().nullable().optional(),
      feedId: z.number(),
      podcastGuid: z.string(),
      chaptersUrl: z.string().url().nullable().optional(),
      transcriptUrl: z.string().url().nullable().optional(),
      soundbite: z.unknown().optional(),
      soundbites: z.unknown().optional(),
      persons: z.unknown().optional(),
      socialInteract: z.unknown().optional(),
      value: z.unknown().optional(),
    }),
  ),
  count: z.number(),
  description: z.string(),
})
