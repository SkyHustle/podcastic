import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { cache } from 'react'

// Cache the database call
const getRandomPodcast = cache(async () => {
  const { data: podcast, error } = await supabase
    .from('podcasts')
    .select('*, episodes(*)')
    .limit(1)
    .order('created_at', { ascending: false })
    .single()

  if (error) {
    console.error('Error fetching random podcast:', error)
    return null
  }

  return podcast
})

function extractHosts(podcast: any): string[] {
  if (!podcast) return []

  // First try to get hosts from episodes' persons data
  const hosts = new Set<string>()
  if (podcast.episodes) {
    podcast.episodes.forEach((episode: any) => {
      if (episode.persons) {
        const persons = Array.isArray(episode.persons) ? episode.persons : []
        persons.forEach((person: any) => {
          if (person.role?.toLowerCase().includes('host') || !person.role) {
            hosts.add(person.name)
          }
        })
      }
    })
  }

  // If no hosts found in episodes, use podcast author
  if (hosts.size === 0 && podcast.author) {
    hosts.add(podcast.author)
  }

  return Array.from(hosts)
}

interface RandomPodcastContentProps {
  renderHosts?: (hosts: string[]) => React.ReactNode
}

async function RandomPodcastContent({
  renderHosts,
}: RandomPodcastContentProps) {
  const podcast = await getRandomPodcast()

  if (!podcast) {
    return null
  }

  const hosts = extractHosts(podcast)

  return (
    <>
      <Link
        href="/"
        className="relative mx-auto block w-48 overflow-hidden rounded-lg bg-slate-200 shadow-xl shadow-slate-200 sm:w-64 sm:rounded-xl lg:w-auto lg:rounded-2xl"
        aria-label="Homepage"
      >
        <Image
          className="w-full"
          src={podcast.artwork}
          alt={podcast.title}
          width={1024}
          height={1024}
          sizes="(min-width: 1024px) 20rem, (min-width: 640px) 16rem, 12rem"
          priority
        />
        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 sm:rounded-xl lg:rounded-2xl" />
      </Link>
      <div className="mt-10 text-center lg:mt-12 lg:text-left">
        <p className="text-xl font-bold text-slate-900">
          <Link href="/">{podcast.title}</Link>
        </p>
        <p className="mt-3 text-lg font-medium leading-8 text-slate-700">
          {podcast.description}
        </p>
      </div>
      {renderHosts && renderHosts(hosts)}
    </>
  )
}

export function RandomPodcast({ renderHosts }: RandomPodcastContentProps) {
  return (
    <Suspense fallback={<div>Loading random podcast...</div>}>
      {/* @ts-ignore */}
      <RandomPodcastContent renderHosts={renderHosts} />
    </Suspense>
  )
}
