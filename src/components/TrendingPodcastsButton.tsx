'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { ButtonProps } from '@/components/Button'

type TrendingPodcastsButtonProps = {
  endpoint: string
  label: string
  variant?: ButtonProps['variant']
}

export function TrendingPodcastsButton({
  endpoint,
  label,
  variant = 'text',
}: TrendingPodcastsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>('')

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={variant}
        disabled={isLoading}
        onClick={async () => {
          try {
            setIsLoading(true)
            setStatus('Fetching trending podcasts...')

            // Step 1: Get trending podcasts
            const trendingResponse = await fetch('/api/podcast-index/trending')
            const trendingData = await trendingResponse.json()

            if (trendingData.error) {
              throw new Error(trendingData.error)
            }

            const savedPodcasts = []

            // Process each trending podcast
            for (const feed of trendingData.feeds) {
              setStatus(`Processing "${feed.title}"...`)

              // Step 2: Get complete podcast details
              const detailsResponse = await fetch(
                `/api/podcast-index/by-feed-id?${new URLSearchParams({
                  feedId: feed.id.toString(),
                })}`,
              )
              const podcastDetails = await detailsResponse.json()

              if (podcastDetails.error) {
                console.error(
                  `Failed to fetch details for "${feed.title}":`,
                  podcastDetails.error,
                )
                continue
              }

              // Step 3: Get latest episodes
              const episodesResponse = await fetch(
                `/api/podcast-index/episodes?${new URLSearchParams({
                  feedId: feed.id.toString(),
                })}`,
              )
              const episodesData = await episodesResponse.json()

              if (episodesData.error) {
                console.error(
                  `Failed to fetch episodes for "${feed.title}":`,
                  episodesData.error,
                )
                continue
              }

              if (!episodesData.items?.length) {
                console.error(`No episodes found for "${feed.title}"`)
                continue
              }

              // Step 4: Save podcast and episodes to database
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
                console.error(`Failed to save "${feed.title}":`, saveData.error)
                continue
              }

              console.log(
                `${saveData.source === 'database' ? 'Found' : 'Added'} "${feed.title}" with ${episodesData.items.length} episodes`,
              )

              // Add to saved podcasts array for trending data
              savedPodcasts.push({
                podcast: {
                  id: saveData.podcast.id,
                  title: saveData.podcast.title,
                },
                trendScore: feed.trendScore,
              })
            }

            // Step 5: Update trending podcasts table
            if (savedPodcasts.length > 0) {
              setStatus('Updating trending podcasts list...')
              const trendingResponse = await fetch(
                '/api/supabase/add-trending-podcasts',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    trendingPodcasts: savedPodcasts,
                  }),
                },
              )

              const trendingResult = await trendingResponse.json()

              if (trendingResult.error) {
                throw new Error(trendingResult.error)
              }
            }

            setStatus('All trending podcasts processed!')
            setTimeout(() => setStatus(''), 3000) // Clear status after 3 seconds
          } catch (error) {
            console.error('Error:', error)
            setStatus(error instanceof Error ? error.message : 'Unknown error')
            setTimeout(() => setStatus(''), 3000) // Clear error after 3 seconds
          } finally {
            setIsLoading(false)
          }
        }}
      >
        {isLoading ? 'Processing...' : label}
      </Button>
      {status && (
        <p className="text-sm text-slate-400" role="status">
          {status}
        </p>
      )}
    </div>
  )
}
