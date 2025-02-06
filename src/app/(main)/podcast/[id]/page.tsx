'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import type { PodcastEpisodesResponse } from '@/lib/schemas/api-schemas'
import type { Podcast } from '@/lib/schemas/db-schemas'
import type { Episode as EpisodeType } from '@/lib/schemas/db-schemas'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PodcastImage } from '@/lib/utils/image'
import { Episode } from '@/components/Episode'
import { formatEpisode } from '@/lib/utils/episode'
import { TrendingLink } from '@/components/TrendingLink'
import Spinner from '@/components/Spinner'

async function fetchPodcast(id: number) {
  const response = await fetch(
    `/api/supabase/fetch-podcast?${new URLSearchParams({
      id: id.toString(),
    })}`,
  )
  const data = await response.json()

  if ('error' in data) {
    throw new Error(data.error)
  }

  return data as Podcast
}

async function fetchEpisodes(feedId: number) {
  const response = await fetch(
    `/api/podcast-index/episodes?${new URLSearchParams({
      feedId: feedId.toString(),
    })}`,
  )
  const data = await response.json()

  if ('error' in data) {
    throw new Error(data.error)
  }

  return data as PodcastEpisodesResponse
}

async function saveEpisodes(episodes: PodcastEpisodesResponse, podcast_id: number) {
  const response = await fetch('/api/supabase/add-episodes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      episodes: episodes.items,
      podcast_id,
    }),
  })

  const data = await response.json()

  if ('error' in data) {
    throw new Error(data.error)
  }

  return data as EpisodeType[]
}

async function fetchSavedEpisodes(podcast_id: number) {
  const response = await fetch(
    `/api/supabase/fetch-episodes?${new URLSearchParams({
      podcast_id: podcast_id.toString(),
    })}`,
  )
  const data = await response.json()

  if ('error' in data) {
    throw new Error(data.error)
  }

  return data as EpisodeType[]
}

export default function PodcastPage({ params }: { params: { id: number } }) {
  const {
    data: podcast,
    isLoading: isPodcastLoading,
    error: podcastError,
  } = useQuery({
    queryKey: ['podcast', params.id],
    queryFn: () => fetchPodcast(params.id),
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    gcTime: 1000 * 60 * 60 * 15, // 15 hours
  })

  const {
    data: podcastIndexEpisodes,
    isLoading: isPodcastIndexEpisodesLoading,
    error: podcastIndexEpisodesError,
  } = useQuery({
    queryKey: ['podcastIndexEpisodes', podcast?.feed_id],
    queryFn: () => fetchEpisodes(podcast?.feed_id ?? 0),
    enabled: !!podcast?.feed_id,
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    gcTime: 1000 * 60 * 60 * 15, // 15 hours
  })

  const queryClient = useQueryClient()

  const {
    data: dbEpisodes,
    isLoading: isDbEpisodesLoading,
    refetch: refetchDbEpisodes,
  } = useQuery({
    queryKey: ['saved-episodes', params.id],
    queryFn: () => fetchSavedEpisodes(params.id),
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    gcTime: 1000 * 60 * 60 * 15, // 15 hours
    enabled: !!podcast?.id,
  })

  const {
    mutateAsync: saveEpisodesMutation,
    isPending: isSavingEpisodes,
    error: saveEpisodesError,
  } = useMutation({
    mutationFn: (data: { episodes: PodcastEpisodesResponse; podcast_id: number }) =>
      saveEpisodes(data.episodes, data.podcast_id),
    onSuccess: (data, variables) => {
      if (podcast?.id) {
        queryClient.setQueryData(['saved-episodes', podcast.id], data)
      }
    },
  })

  const [isSavingAndRefetching, setIsSavingAndRefetching] = useState(false)

  // When we get episodes from Podcast Index, save them to our database
  useEffect(() => {
    async function saveAndRefetchEpisodes() {
      if (podcastIndexEpisodes && podcast?.id && !dbEpisodes?.length) {
        setIsSavingAndRefetching(true)
        try {
          await saveEpisodesMutation({
            episodes: podcastIndexEpisodes,
            podcast_id: podcast.id,
          })
          await refetchDbEpisodes()
        } finally {
          setIsSavingAndRefetching(false)
        }
      }
    }

    saveAndRefetchEpisodes()
  }, [podcastIndexEpisodes, podcast?.id, saveEpisodesMutation, dbEpisodes, refetchDbEpisodes])

  if (podcastError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">
          {podcastError instanceof Error ? podcastError.message : 'Failed to load podcast'}
        </p>
      </div>
    )
  }

  if (isPodcastLoading || !podcast) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const isLoading =
    isPodcastIndexEpisodesLoading ||
    isSavingEpisodes ||
    isDbEpisodesLoading ||
    isSavingAndRefetching

  return (
    <div className="w-full">
      <header className="bg-slate-50 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-112 lg:items-start lg:overflow-y-auto xl:w-120">
        <div className="relative z-10 mx-auto px-4 pb-4 pt-24 sm:px-6 md:max-w-2xl md:px-4 lg:min-h-full lg:flex-auto lg:border-x lg:border-slate-200 lg:px-8 lg:py-12 xl:px-12">
          <TrendingLink />
          <div className="relative mx-auto block w-48 overflow-hidden rounded-lg bg-slate-200 shadow-xl shadow-slate-200 sm:w-64 sm:rounded-xl lg:w-auto lg:rounded-2xl">
            <PodcastImage src={podcast.artwork} alt={podcast.title} />
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 sm:rounded-xl lg:rounded-2xl" />
          </div>
          <div className="mt-10 text-center lg:mt-12 lg:text-left">
            <p className="text-xl font-bold text-slate-900">
              <Link href="/">{podcast.title}</Link>
            </p>
            <p className="text-md mt-3 font-medium leading-8 text-slate-700">
              {podcast.description}
            </p>
          </div>
        </div>
      </header>

      <main className="border-t border-slate-200 lg:relative lg:mb-28 lg:ml-112 lg:border-t-0 xl:ml-120">
        <div className="pb-12 pt-16 sm:pb-4 lg:pt-12">
          <div className="lg:px-8">
            <div className="lg:max-w-4xl">
              <div className="mx-auto px-4 sm:px-6 md:max-w-2xl md:px-4 lg:px-0">
                <h1 className="text-2xl font-bold leading-7 text-slate-900">Episodes</h1>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100 sm:mt-4 lg:mt-8 lg:border-t lg:border-slate-100">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : saveEpisodesError || podcastIndexEpisodesError ? (
              <div className="flex justify-center py-10">
                <p className="text-red-500">
                  {saveEpisodesError || podcastIndexEpisodesError
                    ? (saveEpisodesError || podcastIndexEpisodesError)?.message ||
                      'Failed to load episodes'
                    : 'Failed to load episodes'}
                </p>
              </div>
            ) : dbEpisodes && dbEpisodes.length > 0 ? (
              dbEpisodes.map((episode) => (
                <Episode key={episode.id} episode={formatEpisode(episode)} />
              ))
            ) : podcastIndexEpisodes ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <div className="flex justify-center py-10">
                <p>No episodes found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
