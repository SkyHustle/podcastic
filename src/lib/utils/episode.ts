import type { Episode as DBEpisode } from '@/lib/schemas/db-schemas'
import type { Episode } from '@/components/AudioProvider'

export function formatEpisode(dbEpisode: DBEpisode): Episode {
  const { enclosure_url, enclosure_type, ...rest } = dbEpisode
  return {
    ...rest,
    audio: {
      src: enclosure_url,
      type: enclosure_type,
    },
  }
}
