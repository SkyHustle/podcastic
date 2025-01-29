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
    <>
      <header className="fixed inset-y-0 left-0 z-20 hidden w-112 overflow-y-auto border-r border-slate-200 bg-slate-50 lg:block xl:w-120">
        <div className="relative mx-auto px-4 pb-4 pt-10 sm:px-6 md:max-w-2xl md:px-4 lg:min-h-full lg:flex-auto lg:px-8 lg:py-32 xl:px-12">
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

      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="bg-slate-50 px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="relative mx-auto block w-48 overflow-hidden rounded-lg bg-slate-200 shadow-xl shadow-slate-200 sm:w-64 sm:rounded-xl">
              <PodcastImage src={podcast.artwork} alt={podcast.title} />
              <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 sm:rounded-xl" />
            </div>
            <div className="mt-10 text-center">
              <p className="text-xl font-bold text-slate-900">
                {podcast.title}
              </p>
              <p className="mt-3 text-lg font-medium leading-8 text-slate-700">
                {podcast.description}
              </p>
            </div>
            <div className="mt-10">
              <PodcastSearch />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="min-h-screen bg-white lg:pl-112 xl:pl-120">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Podcast Episodes
            </h2>
            {/* Episodes list will go here */}
          </div>
        </div>
      </main>
    </>
  )
}
