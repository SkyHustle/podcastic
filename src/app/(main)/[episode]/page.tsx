import { cache } from 'react'
import { notFound } from 'next/navigation'

import { Container } from '@/components/Container'
import { EpisodePlayButton } from '@/components/EpisodePlayButton'
import { FormattedDate } from '@/components/FormattedDate'
import { PauseIcon } from '@/components/PauseIcon'
import { PlayIcon } from '@/components/PlayIcon'
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
}

const getEpisode = cache(async (id: string): Promise<Episode> => {
  const { data: episode, error } = await supabase
    .from('episodes')
    .select('*')
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
  }
})

export async function generateMetadata({
  params,
}: {
  params: { episode: string }
}) {
  let episode = await getEpisode(params.episode)

  return {
    title: episode.title,
  }
}

export default async function Episode({
  params,
}: {
  params: { episode: string }
}) {
  let episode = await getEpisode(params.episode)
  let date = episode.published

  return (
    <article className="py-16 lg:py-36">
      <Container>
        <header className="flex flex-col">
          <div className="flex items-center gap-6">
            <EpisodePlayButton
              episode={episode}
              className="group relative flex h-18 w-18 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 hover:bg-slate-900 focus:outline-none focus:ring focus:ring-slate-700 focus:ring-offset-4"
              playing={
                <PauseIcon className="h-9 w-9 fill-white group-active:fill-white/80" />
              }
              paused={
                <PlayIcon className="h-9 w-9 fill-white group-active:fill-white/80" />
              }
            />
            <div className="flex flex-col">
              <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">
                {episode.title}
              </h1>
              <FormattedDate
                date={date}
                className="order-first font-mono text-sm leading-7 text-slate-500"
              />
            </div>
          </div>
          <p
            className="ml-24 mt-3 text-base font-medium leading-7 text-slate-700 sm:text-lg sm:leading-8"
            dangerouslySetInnerHTML={{
              __html: formatDescriptionWithLinks(episode.description),
            }}
          ></p>
        </header>
        <hr className="my-12 border-gray-200" />
      </Container>
    </article>
  )
}
