import { useEffect, useState } from 'react'
import { fetchAllUsage, type ModelUsage } from '@/services/tokenUsage'

export function TokenDashboard() {
  const [usage, setUsage] = useState<ModelUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllUsage().then(u => { setUsage(u); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="border border-[#2f3336] rounded-xl p-4 mb-4">
        <p className="text-[#71767b] text-xs mb-3 uppercase tracking-wider">Uso de tokens</p>
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-8 bg-[#2f3336] rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#2f3336] rounded-xl p-4 mb-4">
      <p className="text-[#71767b] text-xs mb-3 uppercase tracking-wider">Uso de tokens</p>
      <div className="space-y-3">
        {usage.map(u => (
          <div key={u.model}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold" style={{ color: u.color }}>{u.label}</span>
              {u.error ? (
                <span className="text-[#536471] text-[10px]">{u.error}</span>
              ) : (
                <span className="text-[#e7e9ea] text-xs">
                  {u.tokensUsed !== null ? `${u.tokensUsed.toLocaleString()} tokens` : '—'}
                  {u.costUsd !== null ? ` · $${u.costUsd.toFixed(4)}` : ''}
                </span>
              )}
            </div>
            <div className="h-1.5 bg-[#2f3336] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: u.tokensUsed ? `${Math.min((u.tokensUsed / 1_000_000) * 100, 100)}%` : '0%',
                  backgroundColor: u.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
