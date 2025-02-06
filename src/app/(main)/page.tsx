'use client'

import { TrendingFeed } from '@/components/TrendingFeed'
import { PodcastSearch } from '@/components/PodcastSearch'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse gap-4 pt-20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Trending Podcasts
            </h1>
            <p className="text-md mt-2 leading-8 text-gray-600">
              Discover what is popular right now in the podcast world.
            </p>
          </div>
          <div className="w-full sm:w-96">
            <PodcastSearch />
          </div>
        </div>
      </div>
      <TrendingFeed />
    </div>
  )
}
