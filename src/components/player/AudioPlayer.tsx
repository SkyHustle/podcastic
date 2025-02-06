'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { useAudioPlayer } from '@/components/AudioProvider'
import { ForwardButton } from '@/components/player/ForwardButton'
import { MuteButton } from '@/components/player/MuteButton'
import { PlaybackRateButton } from '@/components/player/PlaybackRateButton'
import { PlayButton } from '@/components/player/PlayButton'
import { RewindButton } from '@/components/player/RewindButton'
import { Slider } from '@/components/player/Slider'

function parseTime(seconds: number) {
  let hours = Math.floor(seconds / 3600)
  let minutes = Math.floor((seconds - hours * 3600) / 60)
  seconds = seconds - hours * 3600 - minutes * 60
  return [hours, minutes, seconds]
}

function formatHumanTime(seconds: number) {
  let [h, m, s] = parseTime(seconds)
  return `${h} hour${h === 1 ? '' : 's'}, ${m} minute${
    m === 1 ? '' : 's'
  }, ${s} second${s === 1 ? '' : 's'}`
}

function CloseIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6L18 18" />
    </svg>
  )
}

export function AudioPlayer() {
  let player = useAudioPlayer()

  let wasPlayingRef = useRef(false)

  let [currentTime, setCurrentTime] = useState<number | null>(player.currentTime)

  useEffect(() => {
    setCurrentTime(null)
  }, [player.currentTime])

  if (!player.episode) {
    return null
  }

  return (
    <div className="relative flex items-center gap-6 bg-white/90 px-4 py-4 shadow shadow-slate-200/80 ring-1 ring-slate-900/5 backdrop-blur-sm md:px-6">
      <button
        type="button"
        onClick={() => player.reset()}
        className="absolute right-4 top-4 rounded-md p-1 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        aria-label="Close player"
      >
        <CloseIcon className="h-5 w-5 stroke-slate-500 hover:stroke-slate-700" />
      </button>
      <div className="hidden md:block">
        <PlayButton player={player} />
      </div>
      <div className="mb-[env(safe-area-inset-bottom)] flex flex-1 flex-col gap-3 overflow-hidden p-1">
        <Link
          href={`/${player.episode.id}`}
          className="truncate text-center text-sm font-bold leading-6 md:text-left"
          title={player.episode.title}
        >
          {player.episode.title}
        </Link>
        <div className="flex justify-between gap-6">
          <div className="flex items-center md:hidden">
            <MuteButton player={player} />
          </div>
          <div className="flex flex-none items-center gap-4">
            <RewindButton player={player} />
            <div className="md:hidden">
              <PlayButton player={player} />
            </div>
            <ForwardButton player={player} />
          </div>
          <Slider
            label="Current time"
            maxValue={player.duration}
            step={1}
            value={[currentTime ?? player.currentTime]}
            onChange={([value]) => setCurrentTime(value)}
            onChangeEnd={([value]) => {
              player.seek(value)
              if (wasPlayingRef.current) {
                player.play()
              }
            }}
            onChangeStart={() => {
              wasPlayingRef.current = player.playing
              player.pause()
            }}
            numberFormatter={{ format: formatHumanTime } as Intl.NumberFormat}
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <PlaybackRateButton player={player} />
            </div>
            <div className="hidden items-center md:flex">
              <MuteButton player={player} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
