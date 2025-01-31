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
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim()
      console.log('Heard:', transcript, 'Confidence:', event.results[0][0].confidence)

      if (transcript.includes('play')) {
        console.log('Executing play command')
        player.play()
        setIsListening(false)
      } else if (transcript.includes('pause') || transcript.includes('stop')) {
        console.log('Executing pause command')
        player.pause()
        setIsListening(false)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      console.log('Recognition ended')
      setIsListening(false)
    }

    return recognition
  }

  // Initialize recognition when component mounts
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
      console.log('Starting recognition...')
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
      title={isListening ? 'Voice commands: "play", "pause", "stop"' : 'Enable voice control'}
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
