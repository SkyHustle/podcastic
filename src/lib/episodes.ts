import { type Episode } from './schemas'

export interface AudioEpisode extends Episode {
  audio: {
    src: string
    type: string
  }
}
