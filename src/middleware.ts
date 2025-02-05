import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create a new ratelimiter, that allows 50 requests per 30 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '30 s'),
  analytics: true,
})

// Rate limiting middleware
export async function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Use IP as identifier for rate limiting
    const ip = request.ip ?? '127.0.0.1'
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`)

    if (!success) {
      return new NextResponse('Too many requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      })
    }

    const response = NextResponse.next()

    // Add rate limit headers to all API responses
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', reset.toString())

    return response
  }

  return NextResponse.next()
}

// Configure which routes to apply middleware to
export const config = {
  matcher: '/api/:path*',
}
