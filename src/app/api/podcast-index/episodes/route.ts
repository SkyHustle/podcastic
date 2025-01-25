import { NextResponse } from 'next/server'
import crypto from 'crypto'
import chalk from 'chalk'
import { PodcastEpisodesResponseSchema } from '@/lib/schemas'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const feedId = searchParams.get('feedId')

    if (!feedId) {
      return NextResponse.json(
        { error: 'Feed ID parameter is required' },
        { status: 400 },
      )
    }

    const apiKey = process.env.PODCAST_INDEX_API_KEY?.trim()
    const apiSecret = process.env.PODCAST_INDEX_API_SECRET?.trim()

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    const episodesStart = Date.now()
    const apiHeaderTime = Math.floor(Date.now() / 1000)
    const hash = crypto
      .createHash('sha1')
      .update(apiKey + apiSecret + apiHeaderTime)
      .digest('hex')

    const response = await fetch(
      'https://api.podcastindex.org/api/1.0/episodes/byfeedid?' +
        new URLSearchParams({
          id: feedId,
          max: '10', // Get latest 10 episodes
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
    console.log(
      chalk.blue(`Fetched episodes in ${Date.now() - episodesStart}ms`),
    )

    const validated = PodcastEpisodesResponseSchema.safeParse(data)

    if (!validated.success) {
      console.error(
        'Validation errors:',
        JSON.stringify(validated.error.errors, null, 2),
      )
      return NextResponse.json(
        { error: validated.error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json(validated.data)
  } catch (error) {
    console.error('Error fetching episodes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
