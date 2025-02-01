'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [playbackRate, setPlaybackRate] = useState(playbackRates[0])
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

        // Playback controls
        if (transcript.includes('play')) {
          console.log('Executing play command')
          player.play()
        } else if (transcript.includes('pause') || transcript.includes('stop')) {
          console.log('Executing pause command')
          player.pause()
        }

        // Forward/Rewind
        else if (transcript.includes('forward') || transcript.includes('skip forward')) {
          console.log('Executing forward command')
          player.seekBy(10)
        } else if (transcript.includes('rewind') || transcript.includes('go back')) {
          console.log('Executing rewind command')
          player.seekBy(-10)
        }

        // // Playback speed
        // else if (transcript.includes('speed up') || transcript.includes('faster')) {
        //   console.log('Executing speed up command')
        //   console.log('Current playbackRate before update:', playbackRate)
        //   const existingIdx = playbackRates.indexOf(playbackRate)
        //   console.log('Current index:', existingIdx)
        //   // Cycle to the next rate
        //   const nextIdx = (existingIdx + 1) % playbackRates.length
        //   const next = playbackRates[nextIdx]
        //   console.log('Setting playback rate to:', next.value)
        //   player.playbackRate(next.value)
        //   setPlaybackRate(next)
        //   console.log('Updated playbackRate:', next)
        // } else if (transcript.includes('slow down') || transcript.includes('slower')) {
        //   console.log('Executing slow down command')
        //   console.log('Current playbackRate before update:', playbackRate)
        //   const existingIdx = playbackRates.indexOf(playbackRate)
        //   console.log('Current index:', existingIdx)
        //   // Cycle to the previous rate
        //   const prevIdx = (existingIdx - 1 + playbackRates.length) % playbackRates.length
        //   const prev = playbackRates[prevIdx]
        //   console.log('Setting playback rate to:', prev.value)
        //   player.playbackRate(prev.value)
        //   setPlaybackRate(prev)
        //   console.log('Updated playbackRate:', prev)
        // } else if (transcript.includes('normal speed')) {
        //   console.log('Executing normal speed command')
        //   player.playbackRate(1)
        //   setPlaybackRate(playbackRates[0])
        //   console.log('Reset playbackRate to:', playbackRates[0])
        // }

        // Volume control
        else if (transcript.includes('mute')) {
          console.log('Executing mute command')
          player.toggleMute()
        } else if (transcript.includes('unmute')) {
          console.log('Executing unmute command')
          if (player.muted) {
            player.toggleMute()
          }
        }
      } else {
        // console.log('Interim:', transcript)
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
      console.log('Recognition ended')
      // Only restart if we're still meant to be listening
      if (isListening) {
        console.log('Restarting recognition...')
        restartRecognition()
      } else {
        // If we're not meant to be listening anymore, update the state
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
          : 'Enable voice control'
      }
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
