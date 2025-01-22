'use client'

import { Button } from '@/components/Button'

export function TrendingButton() {
  return (
    <Button
      variant="text"
      onClick={async () => {
        try {
          const response = await fetch('/api/trending-podcasts')
          const data = await response.json()
          if (!data.success) {
            throw new Error('Failed to fetch podcast')
          }
          console.log('Search results:', data)
        } catch (error) {
          console.error('Error:', error)
        }
      }}
    >
      Fetch Trending Podcasts
    </Button>
  )
}
