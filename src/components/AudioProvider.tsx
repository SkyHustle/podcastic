'use client'

import { createContext, useContext, useMemo, useReducer, useRef } from 'react'
import type { Episode as DBEpisode } from '@/lib/schemas'

// Extend the database Episode type with our audio structure
export interface Episode extends Omit<DBEpisode, 'enclosure_url' | 'enclosure_type'> {
  audio: {
    src: string
    type: string
  }
}

interface PlayerState {
  playing: boolean
  muted: boolean
  duration: number
  currentTime: number
  episode: Episode | null
  playbackRate: number
}

interface PublicPlayerActions {
  play: (episode?: Episode) => void
  pause: () => void
  toggle: (episode?: Episode) => void
  seekBy: (amount: number) => void
  seek: (time: number) => void
  setPlaybackRate: (rate: number) => void
  toggleMute: () => void
  isPlaying: (episode?: Episode) => boolean
}

export type PlayerAPI = PlayerState & PublicPlayerActions

const enum ActionKind {
  SET_META = 'SET_META',
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  TOGGLE_MUTE = 'TOGGLE_MUTE',
  SET_CURRENT_TIME = 'SET_CURRENT_TIME',
  SET_DURATION = 'SET_DURATION',
  SET_PLAYBACK_RATE = 'SET_PLAYBACK_RATE',
}

type Action =
  | { type: ActionKind.SET_META; payload: Episode }
  | { type: ActionKind.PLAY }
  | { type: ActionKind.PAUSE }
  | { type: ActionKind.TOGGLE_MUTE }
  | { type: ActionKind.SET_CURRENT_TIME; payload: number }
  | { type: ActionKind.SET_DURATION; payload: number }
  | { type: ActionKind.SET_PLAYBACK_RATE; payload: number }

const AudioPlayerContext = createContext<PlayerAPI | null>(null)

function audioReducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case ActionKind.SET_META:
      return { ...state, episode: action.payload }
    case ActionKind.PLAY:
      return { ...state, playing: true }
    case ActionKind.PAUSE:
      return { ...state, playing: false }
    case ActionKind.TOGGLE_MUTE:
      return { ...state, muted: !state.muted }
    case ActionKind.SET_CURRENT_TIME:
      return { ...state, currentTime: action.payload }
    case ActionKind.SET_DURATION:
      return { ...state, duration: action.payload }
    case ActionKind.SET_PLAYBACK_RATE:
      return { ...state, playbackRate: action.payload }
  }
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  let [state, dispatch] = useReducer(audioReducer, {
    playing: false,
    muted: false,
    duration: 0,
    currentTime: 0,
    episode: null,
    playbackRate: 1,
  })
  let playerRef = useRef<React.ElementRef<'audio'>>(null)

  let actions = useMemo<PublicPlayerActions>(() => {
    return {
      play(episode) {
        if (episode) {
          dispatch({ type: ActionKind.SET_META, payload: episode })

          if (playerRef.current && playerRef.current.currentSrc !== episode.audio.src) {
            let playbackRate = playerRef.current.playbackRate
            playerRef.current.src = episode.audio.src
            playerRef.current.load()
            playerRef.current.pause()
            playerRef.current.playbackRate = playbackRate
            playerRef.current.currentTime = 0
          }
        }

        playerRef.current?.play()
      },
      pause() {
        playerRef.current?.pause()
      },
      toggle(episode) {
        this.isPlaying(episode) ? actions.pause() : actions.play(episode)
      },
      seekBy(amount) {
        if (playerRef.current) {
          playerRef.current.currentTime += amount
        }
      },
      seek(time) {
        if (playerRef.current) {
          playerRef.current.currentTime = time
        }
      },
      setPlaybackRate(rate) {
        if (playerRef.current) {
          playerRef.current.playbackRate = rate
          dispatch({ type: ActionKind.SET_PLAYBACK_RATE, payload: rate })
        }
      },
      toggleMute() {
        dispatch({ type: ActionKind.TOGGLE_MUTE })
      },
      isPlaying(episode) {
        return episode
          ? state.playing && playerRef.current?.currentSrc === episode.audio.src
          : state.playing
      },
    }
  }, [state.playing])

  // Separate stable state from frequently changing state
  let stableState = useMemo(
    () => ({
      playing: state.playing,
      muted: state.muted,
      episode: state.episode,
      playbackRate: state.playbackRate,
    }),
    [state.playing, state.muted, state.episode, state.playbackRate],
  )

  // Combine everything into the API
  let api = useMemo<PlayerAPI>(
    () => ({
      ...stableState,
      ...actions,
      currentTime: state.currentTime,
      duration: state.duration,
    }),
    [stableState, actions, state.currentTime, state.duration],
  )

  return (
    <>
      <AudioPlayerContext.Provider value={api}>{children}</AudioPlayerContext.Provider>
      <audio
        ref={playerRef}
        onPlay={() => dispatch({ type: ActionKind.PLAY })}
        onPause={() => dispatch({ type: ActionKind.PAUSE })}
        onTimeUpdate={(event) => {
          dispatch({
            type: ActionKind.SET_CURRENT_TIME,
            payload: Math.floor(event.currentTarget.currentTime),
          })
        }}
        onDurationChange={(event) => {
          dispatch({
            type: ActionKind.SET_DURATION,
            payload: Math.floor(event.currentTarget.duration),
          })
        }}
        muted={state.muted}
      />
    </>
  )
}

export function useAudioPlayer(episode?: Episode) {
  let player = useContext(AudioPlayerContext)

  return useMemo<PlayerAPI>(
    () => ({
      ...player!,
      play() {
        player!.play(episode)
      },
      toggle() {
        player!.toggle(episode)
      },
      get playing() {
        return player!.isPlaying(episode)
      },
    }),
    [player, episode],
  )
}
