'use client'

import { useEffect, useState, useRef } from 'react'
import { useAudioPlayer } from './AudioProvider'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function VoiceControl({ episode }: { episode: any }) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const player = useAudioPlayer(episode)

  const initializeRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported')
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // Log both interim and final results
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript.toLowerCase().trim()

      if (result.isFinal) {
        console.log('Final:', transcript, '(Confidence:', result[0].confidence, ')')

        // Check for player commands only on final results
        if (transcript.includes('play')) {
          console.log('Executing play command')
          player.play()
        } else if (transcript.includes('pause')) {
          console.log('Executing pause command')
          player.pause()
        }
      } else {
        console.log('Interim:', transcript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      // Only restart on non-abort errors
      if (event.error !== 'aborted' && isListening) {
        restartRecognition()
      }
    }

    recognition.onend = () => {
      console.log('Recognition ended, restarting...')
      if (isListening) {
        restartRecognition()
      }
    }

    return recognition
  }

  const restartRecognition = () => {
    setTimeout(() => {
      try {
        recognitionRef.current?.start()
      } catch (e) {
        console.error('Failed to restart recognition:', e)
      }
    }, 100)
  }

  useEffect(() => {
    recognitionRef.current = initializeRecognition()

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current = null
        } catch (e) {
          console.error('Error during cleanup:', e)
        }
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initializeRecognition()
    }

    const newListeningState = !isListening
    setIsListening(newListeningState)

    if (newListeningState) {
      console.log('Starting continuous recognition...')
      try {
        recognitionRef.current?.start()
      } catch (e) {
        console.error('Error starting recognition:', e)
        setIsListening(false)
      }
    } else {
      console.log('Stopping recognition...')
      try {
        recognitionRef.current?.stop()
      } catch (e) {
        console.error('Error stopping recognition:', e)
      }
    }
  }

  return (
    <button
      onClick={toggleListening}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        isListening
          ? 'bg-pink-500 text-white hover:bg-pink-600'
          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
      }`}
      title="Toggle voice recognition"
    >
      <MicrophoneIcon className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
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
