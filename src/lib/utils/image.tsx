import { PodcastImageWrapper } from '@/components/PodcastImageWrapper'

export function PodcastImage({ src, alt }: { src: string; alt: string }) {
  return <PodcastImageWrapper src={src} alt={alt} />
}
