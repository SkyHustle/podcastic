'use client'

import { useEffect, useState } from 'react'
import type { Podcast } from '@/lib/schemas'

export default function PodcastPage({ params }: { params: { id: string } }) {
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        const response = await fetch(
          `/api/supabase/fetch-podcast?${new URLSearchParams({
            id: params.id,
          })}`,
        )
        const data = await response.json()

        if ('error' in data) {
          setError(data.error)
          return
        }

        setPodcast(data)
        console.log('Fetched podcast:', data)
      } catch (error) {
        setError('Failed to fetch podcast')
        console.error('Error:', error)
      }
    }

    fetchPodcast()
  }, [params.id])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (!podcast) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {podcast.title}
          </h1>
          <p className="mt-4 text-lg text-gray-600">{podcast.description}</p>
        </div>
      </div>
    </div>
  )
}
