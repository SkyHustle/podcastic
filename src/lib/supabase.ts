import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing env.SUPABASE_URL')
}
if (!process.env.SUPABASE_API_KEY) {
  throw new Error('Missing env.SUPABASE_API_KEY')
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY,
)

// Zod schema for runtime validation of podcast data
export const PodcastSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  url: z.string().url(),
  title: z.string(),
  description: z.string(),
  author: z.string(),
  image_url: z.string().url(),
  artwork_url: z.string().url(),
  newest_item_publish_time: z.number(),
  itunes_id: z.number().nullable(),
  trend_score: z.number(),
  language: z.string(),
  categories: z.record(z.string(), z.string()),
})

export type Podcast = z.infer<typeof PodcastSchema>
export type PodcastInsert = Omit<Podcast, 'id' | 'created_at'>

export async function setupDatabase() {
  // Check if the table exists
  const { error } = await supabase.from('podcasts').select('id').limit(1)

  if (error?.code === 'PGRST204') {
    // Table doesn't exist
    console.error(
      'Podcasts table does not exist. Please run the following SQL in your Supabase SQL editor:',
    )
    console.error(`
      create table public.podcasts (
        id bigint primary key generated always as identity,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null,
        url text unique not null,
        title text not null,
        description text not null,
        author text not null,
        image_url text not null,
        artwork_url text not null,
        newest_item_publish_time bigint not null,
        itunes_id bigint,
        trend_score double precision not null,
        language text not null,
        categories jsonb not null
      );
      
      -- Create an index on the url for faster upserts
      create index podcasts_url_idx on public.podcasts(url);
      
      -- Enable Row Level Security (RLS)
      alter table public.podcasts enable row level security;
      
      -- Create a policy that allows all operations for authenticated users
      create policy "Enable all operations for authenticated users" on public.podcasts
        for all
        to authenticated
        using (true)
        with check (true);
    `)
    throw new Error('Database setup required')
  } else if (error) {
    console.error('Error checking database:', error)
    throw error
  }
}
