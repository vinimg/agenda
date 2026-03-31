import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const isReal = Boolean(
  url && key &&
  !url.includes('placeholder') &&
  !url.includes('your-project')
)

export const supabase = isReal ? createClient(url, key, { auth: { persistSession: true } }) : null
export const isOfflineMode = !isReal
