import { useState } from 'react'
import Image from 'next/image'
// Function to attempt HTTPS conversion
function getSecureImageUrl(url: string): string {
  if (!url) return ''
  // Try to convert HTTP to HTTPS
  return url.replace(/^http:\/\//i, 'https://')
}

// Image component with fallback
export function PodcastImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false)
  const secureUrl = getSecureImageUrl(src)

  if (error) {
    return (
      <div className="flex aspect-square h-full w-full items-center justify-center bg-gray-200 p-4 text-center text-sm text-gray-500">
        <div>
          <p>Image Unavailable</p>
          <p className="mt-2 text-xs">This podcast&apos;s artwork could not be loaded</p>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={secureUrl}
      alt={alt}
      width={1024}
      height={1024}
      className="aspect-square h-full w-full object-cover"
      // loading="lazy"
      onError={() => setError(true)}
      priority={true}
    />
  )
}
