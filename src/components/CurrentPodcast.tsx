import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'

// Fetch the current podcast
const getCurrentPodcast = async () => {
  const { data: podcast, error } = await supabase
    .from('podcasts')
    .select('*, episodes(*)')
    .limit(1)
    .order('created_at', { ascending: false })
    .single()

  if (error) {
    console.error('Error fetching podcast:', error)
    return null
  }

  return podcast
}

async function CurrentPodcastContent() {
  const podcast = await getCurrentPodcast()

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
        <p className="text-lg font-bold text-slate-900 sm:text-xl">
          <Link href="/">{podcast.title}</Link>
        </p>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-700 sm:text-base sm:leading-7 md:text-lg md:leading-8">
          {podcast.description}
        </p>
      </div>
    </>
  )
}

export function CurrentPodcast() {
  return (
    <Suspense fallback={<div>Loading podcast...</div>}>
      {/* @ts-ignore */}
      <CurrentPodcastContent />
    </Suspense>
  )
}
