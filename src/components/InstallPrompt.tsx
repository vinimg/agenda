import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40 bg-[#16181c] border border-[#2f3336] rounded-2xl p-4 shadow-xl flex items-center gap-3">
      <div className="w-9 h-9 bg-[#1d9bf0]/10 rounded-full flex items-center justify-center shrink-0">
        <Download size={18} className="text-[#1d9bf0]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#e7e9ea] text-sm font-medium">Instale o app</p>
        <p className="text-[#71767b] text-xs">Use offline, sem navegador</p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-[#1d9bf0] text-white text-xs font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform shrink-0"
      >
        Instalar
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-[#71767b] hover:text-[#e7e9ea] shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  )
}
