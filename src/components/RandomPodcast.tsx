import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'

async function RandomPodcastContent() {
  // Get total count first
  const { count } = await supabase
    .from('podcasts')
    .select('*', { count: 'exact', head: true })

  if (!count) return null

  // Get a random offset
  const randomOffset = Math.floor(Math.random() * count)

  // Fetch a random podcast using offset
  const { data: podcast, error } = await supabase
    .from('podcasts')
    .select('*')
    .range(randomOffset, randomOffset)
    .single()

  if (error) {
    console.error('Error fetching random podcast:', error)
    return null
  }

  if (!podcast) {
    return null
  }

  // Sanitize description to show only first few sentences
  const shortDescription =
    podcast.description.split('.').slice(0, 2).join('.') + '.'

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
          {shortDescription}
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
