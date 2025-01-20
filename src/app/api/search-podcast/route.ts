import { NextResponse } from 'next/server'
import crypto from 'crypto'

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
    console.log('\nHash string:', hashString)
    console.log('Hash string length:', hashString.length)

    // Generate hash using SHA-1
    const hash = crypto.createHash('sha1').update(hashString).digest('hex')

    const response = await fetch(
      'https://api.podcastindex.org/api/1.0/search/byterm?q=this%20week%20in%20startups',
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
    console.log('\nRaw API Response:', responseText)

    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data)
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError)
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
    console.error('\nError:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
