'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type {
  TrendingPodcastsResponse,
  PodcastSearchResponse,
} from '@/lib/schemas'

interface SavedPodcast {
  id: number
  title: string
  image: string
}

export default function TrendingPage() {
  const [feeds, setFeeds] = useState<TrendingPodcastsResponse['feeds']>([])
  const [savedPodcasts, setSavedPodcasts] = useState<
    Record<number, SavedPodcast>
  >({})

  useEffect(() => {
    const fetchTrendingPodcasts = async () => {
      try {
        const response = await fetch('/api/podcast-index/trending')
        if (!response.ok) throw new Error('Failed to fetch trending podcasts')

        const data = (await response.json()) as TrendingPodcastsResponse
        setFeeds(data.feeds)

        // Process each trending podcast
        for (const feed of data.feeds) {
          // Get complete podcast details
          const detailsResponse = await fetch(
            `/api/podcast-index/by-feed-id?${new URLSearchParams({
              feedId: feed.id.toString(),
            })}`,
          )
          const podcastDetails =
            (await detailsResponse.json()) as PodcastSearchResponse

          if ('error' in podcastDetails) {
            console.error(
              `Failed to fetch details for podcast "${feed.title}":`,
              podcastDetails.error,
            )
            continue
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
            console.error(`Failed to save "${feed.title}":`, saveData.error)
            continue
          }

          // Store the saved podcast ID for the feed
          setSavedPodcasts((prev) => ({
            ...prev,
            [feed.id]: {
              id: saveData.podcast.id,
              title: feed.title,
              image: feed.image,
            },
          }))

          console.log(
            `${saveData.source === 'database' ? 'Found' : 'Added'} "${feed.title}"`,
          )
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchTrendingPodcasts()
  }, [])

  return (
    <div className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Trending Podcasts
          </h2>
          <p className="text-md mt-2 leading-8 text-gray-600">
            Discover what is popular right now in the podcast world.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
            {feeds.map((feed) => {
              const savedPodcast = savedPodcasts[feed.id]
              return (
                <div key={feed.id} className="group relative">
                  <Link
                    href={savedPodcast ? `/podcast/${savedPodcast.id}` : '#'}
                    className="block transform overflow-hidden rounded-lg bg-gray-100 transition hover:scale-105"
                  >
                    <Image
                      src={feed.image}
                      alt={feed.title}
                      width={1024}
                      height={1024}
                      className="aspect-square h-full w-full object-cover"
                      loading="lazy"
                    />
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
    </div>
  )
}
