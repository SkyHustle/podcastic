import Link from 'next/link'

function TrendingIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
        stroke="currentColor"
      />
    </svg>
  )
}

export function TrendingLink() {
  return (
    <Link
      href="/"
      className="text-md group mb-8 flex items-center justify-center font-medium text-slate-600 hover:text-slate-900"
    >
      <TrendingIcon className="h-5 w-5 stroke-current" />
      <span className="ml-2">Trending</span>
    </Link>
  )
}
