import { z } from 'zod'

// Shared enums
export const EpisodeType = z.enum(['full', 'trailer', 'bonus'])

// Base types that are common between API and DB
export const BaseMediaFields = {
  title: z.string(),
  description: z.string(),
  link: z.string().url().nullable(),
  image: z.string().url(),
}

export const BasePodcastFields = {
  ...BaseMediaFields,
  author: z.string(),
  language: z.string(),
  explicit: z
    .union([z.boolean(), z.number()])
    .transform((val) => (typeof val === 'number' ? Boolean(val) : val)),
  categories: z.record(z.string(), z.string()).default({}),
}

// Utility types
export type DateString = string
export type UnixTimestamp = number

// Utility functions for type conversion
export const convertUnixToDateString = (timestamp: UnixTimestamp): DateString =>
  new Date(timestamp * 1000).toISOString()

export const convertDateStringToUnix = (
  dateString: DateString,
): UnixTimestamp => Math.floor(new Date(dateString).getTime() / 1000)
