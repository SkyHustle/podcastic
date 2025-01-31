'use client'

import Link from 'next/link'
import { useQuery, useQueries } from '@tanstack/react-query'
import type { TrendingPodcastsResponse, PodcastSearchResponse } from '@/lib/schemas'
import { PodcastImage } from '@/lib/utils/image'

interface SavedPodcast {
  id: number
  title: string
  image: string
}

async function fetchTrendingPodcasts() {
  const response = await fetch('/api/podcast-index/trending')
  if (!response.ok) throw new Error('Failed to fetch trending podcasts')
  const data = (await response.json()) as TrendingPodcastsResponse
  return data.feeds
}

async function processPodcast(feed: TrendingPodcastsResponse['feeds'][0]) {
  try {
    // Get complete podcast details
    const detailsResponse = await fetch(
      `/api/podcast-index/by-feed-id?${new URLSearchParams({
        feedId: feed.id.toString(),
      })}`,
    )
    const podcastDetails = (await detailsResponse.json()) as PodcastSearchResponse

    if ('error' in podcastDetails) {
      throw new Error(typeof podcastDetails.error === 'string' ? podcastDetails.error : 'Unknown error occurred')
    }

    // Save podcast to database
    const saveResponse = await fetch('/api/supabase/add-podcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        podcast: podcastDetails,
      }),
    })

    const saveData = await saveResponse.json()

    if ('error' in saveData) {
      throw new Error(saveData.error)
    }

    return {
      feedId: feed.id,
      savedPodcast: {
        id: saveData.podcast.id,
        title: feed.title,
        image: feed.image,
      },
    }
  } catch (error) {
    console.error(`Failed to process podcast "${feed.title}":`, error)
    return null
  }
}

export default function TrendingPage() {
  // Fetch trending podcasts
  const {
    data: feeds = [],
    isLoading: isLoadingFeeds,
    error,
  } = useQuery({
    queryKey: ['trending-podcasts'],
    queryFn: fetchTrendingPodcasts,
  })

  // Process each podcast in parallel
  const podcastQueries = useQueries({
    queries: feeds.map((feed) => ({
      queryKey: ['podcast-processed', feed.id],
      queryFn: () => processPodcast(feed),
      // Don't refetch automatically
      staleTime: 1000 * 60 * 15, // 15 minutes
      // But keep the data cached
      gcTime: 1000 * 60 * 30, // 30 minutes
      // Don't retry on error
      retry: false,
    })),
  })

  // Convert the processed results into a map
  const savedPodcasts = podcastQueries.reduce(
    (acc, query) => {
      if (query.data?.feedId && query.data?.savedPodcast) {
        acc[query.data.feedId] = query.data.savedPodcast
      }
      return acc
    },
    {} as Record<number, SavedPodcast>,
  )

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error instanceof Error ? error.message : 'Failed to load trending podcasts'}</p>
      </div>
    )
  }

  if (isLoadingFeeds) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">Trending Podcasts</h2>
        <p className="text-md mt-2 leading-8 text-gray-600">Discover what is popular right now in the podcast world.</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
          {feeds.map((feed) => {
            const savedPodcast = savedPodcasts[feed.id]
            return (
              <div key={feed.id} className="group relative">
                <Link
                  href={savedPodcast ? `/podcast/${savedPodcast.id}` : '#'}
                  className="block transform overflow-hidden rounded-lg bg-gray-100 transition hover:scale-105"
                >
                  <PodcastImage src={feed.image} alt={feed.title} />
                </Link>
                <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {feed.title}
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
