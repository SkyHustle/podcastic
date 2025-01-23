import { supabase } from './supabase'
import type { PodcastSearchResult } from './types'

export async function searchPodcasts(
  query: string,
  limit: number = 10,
  minSimilarity: number = 0.3,
): Promise<PodcastSearchResult[]> {
  const { data, error } = await supabase
    .rpc('search_podcasts', {
      search_query: query,
      limit_count: limit,
      min_similarity: minSimilarity,
    })
    .returns<PodcastSearchResult[]>()

  if (error) {
    console.error('Error searching podcasts:', error)
    throw error
  }

  return data || []
}

export async function searchPodcastsByTitle(title: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .textSearch('title', title)
    .limit(limit)

  if (error) {
    console.error('Error searching podcasts by title:', error)
    throw error
  }

  return data || []
}

export async function searchPodcastsByAuthor(
  author: string,
  limit: number = 10,
) {
  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .textSearch('author', author)
    .limit(limit)

  if (error) {
    console.error('Error searching podcasts by author:', error)
    throw error
  }

  return data || []
}

export async function searchPodcastsByDescription(
  description: string,
  limit: number = 10,
) {
  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .textSearch('description', description)
    .limit(limit)

  if (error) {
    console.error('Error searching podcasts by description:', error)
    throw error
  }

  return data || []
}
