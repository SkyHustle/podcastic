'use client'

import { useState } from 'react'
import { Button } from './Button'

export function PodcastSearch() {
  const [title, setTitle] = useState('')

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!title.trim()) return

        try {
          const response = await fetch(
            `/api/fetch-podcast?title=${encodeURIComponent(title.trim())}`,
          )
          const data = await response.json()
          if (data.error) {
            throw new Error(data.error)
          }
          console.log('Search completed successfully!')
        } catch (error) {
          console.error('Error:', error)
        }
      }}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Search by podcast title"
        className="rounded-md border-0 bg-white/5 px-3.5 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-600"
      />
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  )
}
