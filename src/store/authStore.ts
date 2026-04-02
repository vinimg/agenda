import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isOfflineMode } from '@/lib/supabase'
import { pullFromSupabase } from '@/services/sync'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  resetPassword: (email: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  init: async () => {
    if (isOfflineMode || !supabase) {
      set({ loading: false })
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, session, loading: false })
    if (session?.user) pullFromSupabase(session.user.id)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, session })
    })
  },

  signIn: async (email, password) => {
    if (!supabase) return 'Supabase not configured'
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) pullFromSupabase(data.user.id)
    return error?.message ?? null
  },

  signUp: async (email, password) => {
    if (!supabase) return 'Supabase not configured'
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  },

  resetPassword: async (email) => {
    if (!supabase) return 'Supabase not configured'
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return error?.message ?? null
  },

  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
