# Podcastic 🎙️

A modern, feature-rich podcast discovery and listening platform built with Next.js and React.

## Features

- 🔍 **Advanced Podcast Search**: Search through a vast library of podcasts using the Podcast Index API
- 📈 **Trending Podcasts**: Discover what's popular in the podcast world
- 🎵 **Web Audio Player**: Built-in audio player with waveform visualization
- 🎤 **Voice Controls**: Hands-free podcast control with voice commands
- 📱 **Responsive Design**: Seamless experience across all devices
- 🔄 **Real-time Updates**: Powered by React Query for efficient data fetching
- 💾 **Persistent Storage**: Podcast data stored in Supabase

## Tech Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **State Management**:
  - React Query (TanStack Query) for server state
  - React Context for audio player state
- **Database**: Supabase
- **API Integration**: Podcast Index API
- **Styling**: Tailwind CSS
- **Audio Processing**: Web Audio API with waveform visualization

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- Supabase account
- Podcast Index API credentials

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_supabase_api_key
PODCAST_INDEX_API_KEY=your_podcast_index_api_key
PODCAST_INDEX_API_SECRET=your_podcast_index_api_secret
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/podcastic.git
cd podcastic
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (main)/            # Main layout routes
│   └── api/               # API routes
├── components/            # React components
│   ├── player/           # Audio player components
│   └── ...               # Other components
└── lib/                  # Utility functions and configurations
```

## Features in Detail

### Podcast Search

- Real-time search functionality
- Results from the Podcast Index API
- Caching with React Query

### Audio Player

- Custom built audio player with waveform visualization
- Support for playback controls
- Persistent audio state across navigation
- Voice control integration for hands-free operation

### Voice Controls

- Natural voice command recognition using Web Speech API
- Supported commands:
  - **Playback**: "play", "pause", "stop"
  - **Navigation**: "forward", "skip forward", "rewind", "go back"
  - **Speed Control**: "speed up", "faster", "slow down", "slower", "normal speed"
  - **Volume**: "mute", "unmute"
- Real-time command processing
- Continuous listening mode with automatic reconnection
- Visual feedback for voice recognition status

### Trending Podcasts

- Discover popular podcasts
- Regular updates via Supabase
- Efficient data caching

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Podcast Index API](https://podcastindex.org/) for providing podcast data
- [Supabase](https://supabase.com/) for database services
- All the amazing open-source libraries that made this project possible
