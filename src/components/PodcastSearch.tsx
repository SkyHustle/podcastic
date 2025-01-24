'use client'

import { useState } from 'react'
import { Button } from './Button'
import { useRouter } from 'next/navigation'

export function PodcastSearch() {
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()

    // Validate minimum length
    if (trimmedTitle.length < 3) {
      setError('Please enter at least 3 characters')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setStatus('Searching for podcast...')

    try {
      // Step 1: Search by title
      const searchResponse = await fetch(
        `/api/podcast-index/search-by-title?${new URLSearchParams({
          title: trimmedTitle,
        })}`,
      )
      const searchData = await searchResponse.json()

      if (searchData.error) {
        throw new Error(searchData.error)
      }

      if (!searchData.feeds?.[0]) {
        throw new Error('No podcasts found')
      }

      const feedId = searchData.feeds[0].id.toString()
      setStatus('Found podcast, fetching details...')

      // Step 2: Get complete podcast details
      const detailsResponse = await fetch(
        `/api/podcast-index/by-feed-id?${new URLSearchParams({
          feedId,
        })}`,
      )
      const podcastDetails = await detailsResponse.json()

      if (podcastDetails.error) {
        throw new Error(podcastDetails.error)
      }

      setStatus('Fetching latest episodes...')

      // Step 3: Get latest episodes
      const episodesResponse = await fetch(
        `/api/podcast-index/episodes?${new URLSearchParams({
          feedId,
        })}`,
      )
      const episodesData = await episodesResponse.json()

      if (episodesData.error) {
        throw new Error(episodesData.error)
      }

      setStatus('Saving to database...')

      // Step 4: Save everything to database
      const saveResponse = await fetch('/api/supabase/add-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podcast: podcastDetails,
          episodes: episodesData.items,
        }),
      })

      const saveData = await saveResponse.json()

      if (saveData.error) {
        throw new Error(saveData.error)
      }

      // Clear input on success
      setTitle('')
      setStatus('')

      // Show appropriate success message
      if (saveData.source === 'database') {
        setSuccess(`Found "${saveData.podcast.title}" in database`)
      } else {
        setSuccess(`Added "${saveData.podcast.title}" to database`)
      }

      // Refresh the page to show the new podcast
      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to fetch podcast',
      )
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
      setStatus('')
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setError(null)
              setSuccess(null)
            }}
            placeholder="Search by podcast title"
            className="w-full rounded-md border-0 bg-white/5 px-3.5 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 disabled:opacity-50"
            disabled={isLoading}
            minLength={3}
            required
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </form>
      {status && (
        <p className="text-sm text-slate-400" role="status">
          {status}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600" role="status">
          {success}
        </p>
      )}
    </div>
  )
}
