'use client'

import { useEffect, useRef, useState } from 'react'
import { useAudioPlayer } from './AudioProvider'
import { playbackRates } from './player/PlaybackRateButton'

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

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript.toLowerCase().trim()

      if (result.isFinal) {
        console.log('Final:', transcript, '(Confidence:', result[0].confidence, ')')

        if (transcript.includes('play')) {
          console.log('Executing play command')
          player.play()
        } else if (transcript.includes('pause') || transcript.includes('stop')) {
          console.log('Executing pause command')
          player.pause()
        } else if (transcript.includes('forward') || transcript.includes('skip forward')) {
          console.log('Executing forward command')
          player.seekBy(10)
        } else if (transcript.includes('rewind') || transcript.includes('go back')) {
          console.log('Executing rewind command')
          player.seekBy(-10)
        } else if (transcript.includes('speed up') || transcript.includes('faster')) {
          console.log('Executing speed up command')
          const currentRate = player.playbackRate
          const currentIndex = playbackRates.findIndex((rate) => rate.value === currentRate)
          if (currentIndex === playbackRates.length - 1) {
            console.log('Already at maximum speed')
            return
          }
          const nextIndex = currentIndex === -1 ? 0 : currentIndex + 1
          const nextRate = playbackRates[nextIndex].value
          console.log('Setting playback rate to:', nextRate)
          player.setPlaybackRate(nextRate)
        } else if (transcript.includes('slow down') || transcript.includes('slower')) {
          console.log('Executing slow down command')
          const currentRate = player.playbackRate
          const currentIndex = playbackRates.findIndex((rate) => rate.value === currentRate)
          if (currentIndex === 0 || currentIndex === -1) {
            console.log('Already at minimum speed')
            return
          }
          const prevRate = playbackRates[currentIndex - 1].value
          console.log('Setting playback rate to:', prevRate)
          player.setPlaybackRate(prevRate)
        } else if (transcript.includes('normal speed')) {
          console.log('Executing normal speed command')
          player.setPlaybackRate(playbackRates[0].value)
        } else if (transcript.includes('mute')) {
          console.log('Executing mute command')
          player.toggleMute()
        } else if (transcript.includes('unmute')) {
          console.log('Executing unmute command')
          if (player.muted) {
            player.toggleMute()
          }
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (event.error !== 'aborted' && isListening) {
        restartRecognition()
      }
    }

    recognition.onend = () => {
      console.log('Recognition ended')
      if (isListening) {
        console.log('Restarting recognition...')
        restartRecognition()
      } else {
        setIsListening(false)
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
      title={
        isListening
          ? 'Voice commands: play, pause, forward, rewind, speed up, slow down, normal speed, mute, unmute'
          : 'Voice control'
      }
    >
      <MicrophoneIcon className={`h-8 w-8 ${isListening ? 'animate-pulse' : ''}`} />
      {isListening ? 'Listening...' : 'Voice Control'}
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
