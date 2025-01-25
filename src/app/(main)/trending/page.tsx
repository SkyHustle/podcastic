'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'

interface Feed {
  image: string
  title: string
  id: number
}

export default function TrendingPage() {
  const [feeds, setFeeds] = useState<Feed[]>([])

  useEffect(() => {
    const abortController = new AbortController()

    const fetchTrendingPodcasts = async () => {
      try {
        const response = await fetch('/api/podcast-index/trending', {
          signal: abortController.signal,
        })
        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setFeeds(data.feeds.slice(0, 12))
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return // Ignore abort errors
        }
        console.error('Error fetching trending podcasts:', error)
      }
    }

    fetchTrendingPodcasts()

    return () => {
      abortController.abort()
    }
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
            {feeds.map((feed) => (
              <div key={feed.id} className="group relative">
                <a
                  href="#"
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
                </a>
                <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {feed.title}
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
