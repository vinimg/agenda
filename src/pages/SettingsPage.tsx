import { useAuthStore } from '@/store/authStore'

export function SettingsPage() {
  const { user, signOut } = useAuthStore()

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-24 md:pb-8">
      <h1 className="text-[#e7e9ea] text-2xl font-bold mb-6">Settings</h1>

      {user && (
        <div className="border border-[#2f3336] rounded-xl p-4 mb-4">
          <p className="text-[#71767b] text-xs mb-1">Conta</p>
          <p className="text-[#e7e9ea] text-sm">{user.email}</p>
          <button
            onClick={signOut}
            className="mt-4 w-full border border-red-500/50 text-red-400 rounded-xl py-2 text-sm font-medium active:scale-95 transition-transform hover:bg-red-500/10"
          >
            Sair
          </button>
        </div>
      )}

      <div className="border border-[#2f3336] rounded-xl p-4 text-[#71767b] text-sm">
        <p>Supabase sync and account settings coming soon.</p>
        <p className="mt-2">Data is stored locally in your browser (IndexedDB).</p>
      </div>
    </div>
  )
}
