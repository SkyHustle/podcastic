'use client'

import { useQuery } from '@tanstack/react-query'
import type { Podcast } from '@/lib/schemas'
import { PodcastSearch } from '@/components/PodcastSearch'
import Link from 'next/link'
import { PodcastImage } from '@/lib/utils/image'

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
    <div className="min-h-screen">
      <header className="bg-slate-50 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-112 lg:items-start lg:overflow-y-auto xl:w-120">
        <div className="relative z-10 mx-auto px-4 pb-4 pt-10 sm:px-6 md:max-w-2xl md:px-4 lg:min-h-full lg:flex-auto lg:border-x lg:border-slate-200 lg:px-8 lg:py-12 xl:px-12">
          <div className="relative mx-auto block w-48 overflow-hidden rounded-lg bg-slate-200 shadow-xl shadow-slate-200 sm:w-64 sm:rounded-xl lg:w-auto lg:rounded-2xl">
            <PodcastImage src={podcast.artwork} alt={podcast.title} />
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 sm:rounded-xl lg:rounded-2xl" />
          </div>
          <div className="mt-10 text-center lg:mt-12 lg:text-left">
            <p className="text-xl font-bold text-slate-900">
              <Link href="/">{podcast.title}</Link>
            </p>
            <p className="mt-3 text-lg font-medium leading-8 text-slate-700">
              {podcast.description}
            </p>
          </div>
          <section className="mt-10 lg:mt-12">
            <div className="h-px bg-gradient-to-r from-slate-200/0 via-slate-200 to-slate-200/0 lg:hidden" />
            <div className="mt-4 flex justify-center lg:block">
              <PodcastSearch />
            </div>
          </section>
        </div>
      </header>

      {/* Main content area - shifted right on desktop */}
      <div className="lg:pl-112 xl:pl-120">
        <main className="min-h-screen bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Podcast Episodes
              </h2>
              {/* Episodes list will go here */}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
