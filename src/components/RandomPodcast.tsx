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

async function RandomPodcastContent() {
  const podcast = await getRandomPodcast()

  if (!podcast) {
    return null
  }

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
    </>
  )
}

export function RandomPodcast() {
  return (
    <Suspense fallback={<div>Loading random podcast...</div>}>
      {/* @ts-ignore */}
      <RandomPodcastContent />
    </Suspense>
  )
}
