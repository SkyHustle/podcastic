import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Configure DOMPurify to only allow basic formatting tags
export const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

// Schema for podcast index API responses
export const PodcastIndexSchema = z.object({
  status: z.literal('true').or(z.literal(true)),
  feeds: z.array(
    z.object({
      id: z.number(),
      url: z.string().url(),
      title: z.string(),
      description: z.string(),
      author: z.string(),
      image: z.string().url(),
      artwork: z.string().url(),
      link: z.string().url().nullable().optional(),
      originalUrl: z.string().url().nullable().optional(),
      itunesId: z.number().nullable(),
      language: z.string(),
      categories: z.record(z.string(), z.string()),
      newestItemPublishTime: z.number().optional(),
      trendScore: z.number().optional(),
      episodeCount: z.number().optional(),
      podcastGuid: z.string(),
    }),
  ),
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
      enclosureUrl: z.string().url(),
      enclosureType: z.string(),
      enclosureLength: z.number().nullable().optional(),
      duration: z.number().nullable().optional(),
      explicit: z.number(),
      episode: z.number().nullable().optional(),
      episodeType: z.string().nullable().optional(),
      season: z.number().nullable().optional(),
      image: z.string().url().nullable().optional(),
      feedItunesId: z.number().nullable().optional(),
      feedImage: z.string().url().nullable().optional(),
      feedId: z.number(),
      podcastGuid: z.string(),
      transcriptUrl: z.string().url().nullable().optional(),
      chaptersUrl: z.string().url().nullable().optional(),
    }),
  ),
  count: z.number(),
  description: z.string(),
})
