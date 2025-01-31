import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { EpisodePlayButton } from '@/components/EpisodePlayButton'
import { FormattedDate } from '@/components/FormattedDate'
import { PauseIcon } from '@/components/PauseIcon'
import { PlayIcon } from '@/components/PlayIcon'
import { PodcastImage } from '@/lib/utils/image'
import { TrendingLink } from '@/components/TrendingLink'
import { supabase } from '@/lib/supabase'
import { stripHtmlAndUrls, formatDescriptionWithLinks } from '@/lib/utils'

interface Episode {
  id: number
  title: string
  published: Date
  description: string
  audio: {
    src: string
    type: string
  }
  podcast: {
    id: number
    title: string
    description: string
    artwork: string
  }
}

const getEpisode = cache(async (id: string): Promise<Episode> => {
  const { data: episode, error } = await supabase
    .from('episodes')
    .select(
      `
      *,
      podcast:podcast_id (
        id,
        title,
        description,
        artwork
      )
    `,
    )
    .eq('id', parseInt(id))
    .single()

  if (error || !episode) {
    notFound()
  }

  return {
    id: episode.id,
    title: episode.title,
    published: new Date(episode.date_published),
    description: episode.description,
    audio: {
      src: episode.enclosure_url,
      type: episode.enclosure_type,
    },
    podcast: episode.podcast,
  }
})

export async function generateMetadata({ params }: { params: { id: string } }) {
  let episode = await getEpisode(params.id)

  return {
    title: episode.title,
  }
}

export default async function Episode({ params }: { params: { id: string } }) {
  let episode = await getEpisode(params.id)
  let date = episode.published

  return (
    <div className="w-full">
      <header className="bg-slate-50 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-112 lg:items-start lg:overflow-y-auto xl:w-120">
        <div className="relative z-10 mx-auto px-4 pb-4 pt-24 sm:px-6 md:max-w-2xl md:px-4 lg:min-h-full lg:flex-auto lg:border-x lg:border-slate-200 lg:px-8 lg:py-12 xl:px-12">
          <TrendingLink />
          <div className="relative mx-auto block w-48 overflow-hidden rounded-lg bg-slate-200 shadow-xl shadow-slate-200 sm:w-64 sm:rounded-xl lg:w-auto lg:rounded-2xl">
            <PodcastImage src={episode.podcast.artwork} alt={episode.podcast.title} />
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 sm:rounded-xl lg:rounded-2xl" />
          </div>
          <div className="mt-10 text-center lg:mt-12 lg:text-left">
            <p className="text-xl font-bold text-slate-900">
              <Link href={`/podcast/${episode.podcast.id}`}>{episode.podcast.title}</Link>
            </p>
            <p className="mt-3 text-lg font-medium leading-8 text-slate-700">
              {episode.podcast.description}
            </p>
          </div>
        </div>
      </header>

      <main className="border-t border-slate-200 lg:relative lg:mb-28 lg:ml-112 lg:border-t-0 xl:ml-120">
        <article className="py-16 lg:py-36">
          <Container>
            <header className="flex flex-col">
              <div className="flex items-center gap-6">
                <EpisodePlayButton
                  episode={episode}
                  className="group relative flex h-18 w-18 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 hover:bg-slate-900 focus:outline-none focus:ring focus:ring-slate-700 focus:ring-offset-4"
                  playing={<PauseIcon className="h-9 w-9 fill-white group-active:fill-white/80" />}
                  paused={<PlayIcon className="h-9 w-9 fill-white group-active:fill-white/80" />}
                />
                <div className="flex flex-col">
                  <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl md:text-4xl">
                    {episode.title}
                  </h1>
                  <FormattedDate
                    date={date}
                    className="order-first font-mono text-sm leading-7 text-slate-500"
                  />
                </div>
              </div>
              <p
                className="ml-24 mt-3 text-sm font-medium leading-6 text-slate-700 sm:text-base sm:leading-7 md:text-lg md:leading-8"
                dangerouslySetInnerHTML={{
                  __html: formatDescriptionWithLinks(episode.description),
                }}
              ></p>
            </header>
            <hr className="my-12 border-gray-200" />
          </Container>
        </article>
      </main>
    </div>
  )
}
