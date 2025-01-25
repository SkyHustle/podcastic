import { NextResponse } from 'next/server'
import crypto from 'crypto'
import chalk from 'chalk'
import { TrendingPodcastsSchema } from '@/lib/podcast-index'

export async function GET(request: Request) {
  try {
    const apiKey = process.env.PODCAST_INDEX_API_KEY?.trim()
    const apiSecret = process.env.PODCAST_INDEX_API_SECRET?.trim()

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    const trendingStart = Date.now()
    const apiHeaderTime = Math.floor(Date.now() / 1000)
    const hash = crypto
      .createHash('sha1')
      .update(apiKey + apiSecret + apiHeaderTime)
      .digest('hex')

    const response = await fetch(
      'https://api.podcastindex.org/api/1.0/podcasts/trending?' +
        new URLSearchParams({
          max: '25',
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
    console.log(
      chalk.blue(
        `Fetched trending podcasts in ${Date.now() - trendingStart}ms`,
      ),
    )

    data.feeds?.forEach((feed: any, index: number) => {
      console.log(chalk.green(`${index + 1}. ${feed.title} by ${feed.author}`))
    })
    console.log(chalk.blue('=====================\n'))

    const validated = TrendingPodcastsSchema.safeParse(data)

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
    console.error('Error fetching trending podcasts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
