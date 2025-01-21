'use client'

export function SearchButton() {
  return (
    <button
      className="group flex items-center text-sm font-medium transition-colors hover:text-gray-900"
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
      FETCH
    </button>
  )
}
