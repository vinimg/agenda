import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { InstallPrompt } from '@/components/InstallPrompt'
import { TodayPage } from '@/pages/TodayPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { TasksPage } from '@/pages/TasksPage'
import { HabitsPage } from '@/pages/HabitsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AuthPage } from '@/pages/AuthPage'
import { useAuthStore } from '@/store/authStore'
import { isOfflineMode } from '@/lib/supabase'
import { pullFromSupabase } from '@/services/sync'

export default function App() {
  const { user, loading, init } = useAuthStore()

  useEffect(() => { init() }, [])

  // Pull from Supabase whenever a user session becomes available
  useEffect(() => {
    if (user) pullFromSupabase(user.id)
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isOfflineMode && !user) {
    return <AuthPage />
  }

  return (
    <BrowserRouter>
      <InstallPrompt />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
