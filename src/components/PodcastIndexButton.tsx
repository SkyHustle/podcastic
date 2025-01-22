'use client'

import { Button } from '@/components/Button'
import { ButtonProps } from '@/components/Button'

type PodcastIndexButtonProps = {
  endpoint: string
  label: string
  variant?: ButtonProps['variant']
}

export function PodcastIndexButton({
  endpoint,
  label,
  variant = 'text',
}: PodcastIndexButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={async () => {
        try {
          const response = await fetch(`/api/${endpoint}`)
          const data = await response.json()

          // Check for errors
          if (data.error) {
            throw new Error(data.error)
          }

          // Log success
          console.log(`${label} completed successfully!`)
        } catch (error) {
          console.error('Error:', error)
        }
      }}
    >
      {label}
    </Button>
  )
}
