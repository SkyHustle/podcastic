'use client'

import { useQuery } from '@tanstack/react-query'
import type { Podcast } from '@/lib/schemas'

async function fetchPodcast(id: string) {
  const response = await fetch(
    `/api/supabase/fetch-podcast?${new URLSearchParams({
      id,
    })}`,
  )
  const data = await response.json()

  if ('error' in data) {
    throw new Error(data.error)
  }

  return data as Podcast
}

export default function PodcastPage({ params }: { params: { id: string } }) {
  const {
    data: podcast,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['podcast', params.id],
    queryFn: () => fetchPodcast(params.id),
  })

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">
          {error instanceof Error ? error.message : 'Failed to load podcast'}
        </p>
      </div>
    )
  }

  if (isLoading || !podcast) {
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
