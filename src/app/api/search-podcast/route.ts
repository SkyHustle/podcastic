import { NextResponse } from 'next/server'
import crypto from 'crypto'
import chalk from 'chalk'
import { z } from 'zod'

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

type PodcastResponse = z.infer<typeof PodcastSchema>

export async function GET() {
  try {
    const apiKey = process.env.PODCAST_INDEX_API_KEY?.trim()
    const apiSecret = process.env.PODCAST_INDEX_API_SECRET?.trim()

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    const apiHeaderTime = Math.floor(Date.now() / 1000)

    // Simple concatenation as shown in docs
    const hashString = apiKey + apiSecret + apiHeaderTime

    // Generate hash using SHA-1
    const hash = crypto.createHash('sha1').update(hashString).digest('hex')

    console.log('\n' + chalk.blue.bold('=== API Request Details ==='))
    console.log(chalk.cyan('Timestamp:'), chalk.yellow(apiHeaderTime))
    console.log(chalk.cyan('Generated Hash:'), chalk.yellow(hash))
    console.log(chalk.blue.bold('=======================\n'))

    const response = await fetch(
      'https://api.podcastindex.org/api/1.0/podcasts/trending?' +
        new URLSearchParams({
          max: '5',
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

    const responseText = await response.text()
    console.log(chalk.magenta.bold('=== API Response ==='))
    try {
      // Try to pretty print JSON if it's valid
      const parsed = JSON.parse(responseText)
      const validated = PodcastSchema.safeParse(parsed)

      if (!validated.success) {
        console.log(chalk.red('Validation Error:'), validated.error)
        console.log(chalk.red('Raw Response:'), parsed)
        console.log(chalk.magenta.bold('==================\n'))
        return NextResponse.json(
          {
            error: 'Schema validation failed',
            details: validated.error.errors,
            raw: parsed,
          },
          { status: 400 },
        )
      }

      console.log(chalk.green(JSON.stringify(validated.data, null, 2)))
      console.log(chalk.magenta.bold('==================\n'))
      return NextResponse.json(validated.data)
    } catch (parseError) {
      console.log(chalk.red(responseText))
      console.log(chalk.magenta.bold('==================\n'))
      return NextResponse.json(
        {
          error: 'Invalid API response',
          responseText,
          status: response.status,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.log(chalk.red.bold('\n=== Error ==='))
    console.log(
      chalk.red(error instanceof Error ? error.message : 'Unknown error'),
    )
    console.log(chalk.red.bold('============\n'))
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
