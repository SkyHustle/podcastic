import { AudioProvider } from '@/components/AudioProvider'
import { AudioPlayer } from '@/components/player/AudioPlayer'
import { Waveform } from '@/components/Waveform'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AudioProvider>
      <div className="relative min-h-screen">
        {/* Waveform with higher z-index to ensure visibility */}
        <div className="fixed inset-x-0 top-0 z-30">
          <Waveform className="h-20 w-full" />
        </div>

        {/* Main content */}
        <main className="relative border-t border-slate-200 pt-20">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-slate-50 py-10 pb-40 sm:py-16 sm:pb-32 lg:hidden">
          <div className="mx-auto px-4 sm:px-6 md:max-w-2xl md:px-4">
            Mobile Footer
          </div>
        </footer>

        {/* Audio Player */}
        <div className="fixed inset-x-0 bottom-0 z-40">
          <AudioPlayer />
        </div>
      </div>
    </AudioProvider>
  )
}
