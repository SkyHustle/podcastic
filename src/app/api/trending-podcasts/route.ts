import { NextResponse } from 'next/server'
import crypto from 'crypto'
import chalk from 'chalk'
import { z } from 'zod'

const prettyPrint = (obj: any): void => {
  console.log(chalk.green(JSON.stringify(obj, null, 2)))
}

const PodcastSchema = z.object({
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
      newestItemPublishTime: z.number(),
      itunesId: z.number().nullable(),
      trendScore: z.number(),
      language: z.string(),
      categories: z.record(z.string(), z.string()),
    }),
  ),
  count: z.number(),
  description: z.string(),
  status_code: z.number().optional(),
})

export async function GET() {
  try {
    const apiKey = process.env.PODCAST_INDEX_API_KEY?.trim()
    const apiSecret = process.env.PODCAST_INDEX_API_SECRET?.trim()

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    const apiHeaderTime = Math.floor(Date.now() / 1000)
    const hash = crypto
      .createHash('sha1')
      .update(apiKey + apiSecret + apiHeaderTime)
      .digest('hex')

    const response = await fetch(
      'https://api.podcastindex.org/api/1.0/podcasts/trending?' +
        new URLSearchParams({
          max: '10',
          lang: 'en',
          cat: '9,11,12,102,112',
          pretty: 'true',
        }),
      {
        headers: {
          'User-Agent': 'PodAI/1.0',
          'X-Auth-Date': apiHeaderTime.toString(),
          'X-Auth-Key': apiKey,
          Authorization: hash,
        },
      },
    )

    const data = await response.json()
    const validated = PodcastSchema.safeParse(data)

    if (!validated.success) {
      console.log('Validation Error:', validated.error)
      return NextResponse.json(
        { error: validated.error.errors },
        { status: 400 },
      )
    }

    console.log('\n=== API Response ===')
    prettyPrint(validated.data)
    console.log('==================\n')

    return NextResponse.json(validated.data)
  } catch (error) {
    console.log('\nError:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
