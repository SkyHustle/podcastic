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
