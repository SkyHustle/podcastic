'use client'

import { useState } from 'react'
import { Button } from './Button'

export function PodcastSearch() {
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

    try {
      const response = await fetch(
        `/api/fetch-podcast?title=${encodeURIComponent(trimmedTitle)}`,
      )
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Clear input on success
      setTitle('')

      // Show appropriate success message
      if (data.source === 'database') {
        setSuccess(`Found "${data.podcast.title}" in database`)
      } else {
        setSuccess(`Added "${data.podcast.title}" to database`)
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to fetch podcast',
      )
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError(null)
            setSuccess(null)
          }}
          placeholder="Search by podcast title"
          className="min-w-[200px] rounded-md border-0 bg-white/5 px-3.5 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 disabled:opacity-50"
          disabled={isLoading}
          minLength={3}
          required
        />
        <Button type="submit" variant="secondary" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </form>
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
