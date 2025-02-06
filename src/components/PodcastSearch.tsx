'use client'

import { useState, useEffect } from 'react'
import { Button } from './Button'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'

export function PodcastSearch() {
  const [title, setTitle] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const router = useRouter()

  // Load search history on component mount
  useEffect(() => {
    const history = localStorage.getItem('podcastSearchHistory')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  // Save successful search to history
  const addToHistory = (query: string) => {
    const newHistory = [query, ...searchHistory.filter((item) => item !== query)].slice(0, 5)
    setSearchHistory(newHistory)
    localStorage.setItem('podcastSearchHistory', JSON.stringify(newHistory))
  }

  // Search and save podcast mutation
  const searchAndSaveMutation = useMutation({
    mutationFn: async (searchTitle: string) => {
      // Step 1: Search by title in Podcast Index
      const searchResponse = await fetch(
        `/api/podcast-index/search-by-title?${new URLSearchParams({
          title: searchTitle,
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

      // Step 2: Get complete podcast details from Podcast Index
      const detailsResponse = await fetch(
        `/api/podcast-index/by-feed-id?${new URLSearchParams({
          feedId,
        })}`,
      )
      const podcastDetails = await detailsResponse.json()

      if (podcastDetails.error) {
        throw new Error(podcastDetails.error)
      }

      // Step 3: Try to save to database (or get existing)
      const saveResponse = await fetch('/api/supabase/add-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podcast: podcastDetails,
        }),
      })

      const savedData = await saveResponse.json()

      if (savedData.error) {
        throw new Error(savedData.error)
      }

      return savedData
    },
    onSuccess: (data) => {
      // Log whether the podcast was newly saved or already existed
      if (data.source === 'database') {
        console.log(`Found "${data.podcast.title}" in database`)
      } else {
        console.log(`Added "${data.podcast.title}" to database`)
      }

      // Navigate to the podcast page using the database ID
      router.push(`/podcast/${data.podcast.id}`)
      router.refresh()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()

    // Validate minimum length
    if (trimmedTitle.length < 3) {
      return
    }

    try {
      await searchAndSaveMutation.mutateAsync(trimmedTitle)
      addToHistory(trimmedTitle)
      setTitle('')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="w-full">
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Search by podcast title"
            className="w-full rounded-md border-0 bg-white/5 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 disabled:opacity-50"
            disabled={searchAndSaveMutation.isPending}
            minLength={3}
            required
            list="podcast-search-history"
          />
          <datalist id="podcast-search-history">
            {searchHistory.map((item, index) => (
              <option key={index} value={item} />
            ))}
          </datalist>
        </div>
        <Button
          type="submit"
          disabled={searchAndSaveMutation.isPending}
          className="shrink-0 rounded-md bg-pink-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-pink-600 active:bg-pink-700"
        >
          {searchAndSaveMutation.isPending ? 'Searching...' : 'Search'}
        </Button>
      </form>
      {searchAndSaveMutation.error && (
        <div className="mt-1">
          <p className="text-xs text-red-500" role="alert">
            {searchAndSaveMutation.error instanceof Error
              ? searchAndSaveMutation.error.message
              : 'An error occurred'}
          </p>
        </div>
      )}
    </div>
  )
}
