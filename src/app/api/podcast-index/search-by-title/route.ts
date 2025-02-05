import { NextResponse } from 'next/server'
import crypto from 'crypto'
import chalk from 'chalk'
import { PodcastSearchResponseSchema } from '@/lib/schemas'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')

    if (!title) {
      return NextResponse.json({ error: 'Title parameter is required' }, { status: 400 })
    }

    const apiKey = process.env.PODCAST_INDEX_API_KEY?.trim()
    const apiSecret = process.env.PODCAST_INDEX_API_SECRET?.trim()

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    const searchStart = Date.now()
    const apiHeaderTime = Math.floor(Date.now() / 1000)
    const hash = crypto
      .createHash('sha1')
      .update(apiKey + apiSecret + apiHeaderTime)
      .digest('hex')

    const response = await fetch(
      'https://api.podcastindex.org/api/1.0/search/bytitle?' +
        new URLSearchParams({
          q: title,
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
    console.log(chalk.blue(`Searched podcast in ${Date.now() - searchStart}ms`))

    const validated = PodcastSearchResponseSchema.safeParse(data)

    if (!validated.success) {
      console.error('Validation errors:', JSON.stringify(validated.error.errors, null, 2))
      return NextResponse.json({ error: validated.error.errors }, { status: 400 })
    }

    if (validated.data.feeds.length === 0) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 })
    }

    return NextResponse.json(validated.data)
  } catch (error) {
    console.error('Error searching podcast:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
