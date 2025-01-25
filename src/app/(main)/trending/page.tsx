import React from 'react'

export default function TrendingPage() {
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
