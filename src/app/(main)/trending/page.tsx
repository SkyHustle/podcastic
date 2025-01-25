'use client'

import React, { useEffect } from 'react'

export default function TrendingPage() {
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

        console.log(data)
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return // Ignore abort errors
        }
        console.error('Error fetching trending podcasts:', error)
      }
    }

    fetchTrendingPodcasts()

    return () => {
      abortController.abort() // Cleanup function to cancel the fetch if component unmounts
    }
  }, []) // Empty dependency array means this runs once when component mounts

  return (
    <div className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Trending Podcasts
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Discover what is popular right now in the podcast world.
          </p>
          {/* Add your trending podcasts list component here */}
        </div>
      </div>
    </div>
  )
}
