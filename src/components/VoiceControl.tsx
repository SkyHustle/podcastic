'use client'

import { useEffect, useState } from 'react'
import { useAudioPlayer } from './AudioProvider'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function VoiceControl({ episode }: { episode: any }) {
  const [isListening, setIsListening] = useState(false)
  const player = useAudioPlayer(episode)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase()
      console.log('Voice command:', command)

      if (command.includes('play')) {
        player.play()
      } else if (command.includes('pause') || command.includes('stop')) {
        player.pause()
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    if (isListening) {
      recognition.start()
    }

    return () => {
      recognition.stop()
    }
  }, [isListening, player])

  return (
    <button
      onClick={() => setIsListening(!isListening)}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
        isListening
          ? 'bg-pink-500 text-white hover:bg-pink-600'
          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
      }`}
    >
      <MicrophoneIcon className="h-4 w-4" />
      {isListening ? 'Listening...' : 'Enable Voice Control'}
    </button>
  )
}

function MicrophoneIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
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
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 23h8" stroke="currentColor" />
    </svg>
  )
}
