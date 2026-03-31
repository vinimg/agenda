import { useEffect, useState } from 'react'
import { format, startOfYear, addDays, getDay } from 'date-fns'
import { db } from '@/db'

interface Props {
  anchor: Date
  onDayClick: (date: Date) => void
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getColor(ratio: number | null): string {
  if (ratio === null) return '#16181c'
  if (ratio === 0) return '#16181c'
  if (ratio < 0.5) return '#7856ff55'
  if (ratio < 1) return '#7856ffaa'
  return '#00ba7c'
}

export function YearView({ anchor, onDayClick }: Props) {
  const year = anchor.getFullYear()

  // Build the 52-week grid. Start from the Sunday before Jan 1.
  const jan1 = startOfYear(new Date(year, 0, 1))
  const gridStart = addDays(jan1, -getDay(jan1)) // previous Sunday

  // Build all days for the grid (52*7 = 364 or 53*7 = 371 to cover the year)
  const weeksCount = 53
  const cells: Date[] = Array.from({ length: weeksCount * 7 }, (_, i) => addDays(gridStart, i))

  const [completionMap, setCompletionMap] = useState<Record<string, number>>({})

  useEffect(() => {
    async function load() {
      const startStr = format(gridStart, 'yyyy-MM-dd')
      const endStr = format(addDays(gridStart, weeksCount * 7 - 1), 'yyyy-MM-dd')

      const [habits, entries] = await Promise.all([
        db.habits.filter(h => !!h.isActive).toArray(),
        db.habitEntries.filter(e => e.date >= startStr && e.date <= endStr).toArray(),
      ])

      // For each date, count how many habits were due and how many completed
      const map: Record<string, { due: number; done: number }> = {}

      for (let i = 0; i < weeksCount * 7; i++) {
        const d = addDays(gridStart, i)
        const dateStr = format(d, 'yyyy-MM-dd')
        const dow = getDay(d) as 0|1|2|3|4|5|6

        let due = 0
        for (const h of habits) {
          const { frequencyType, weekDays } = h.schedule
          if (frequencyType === 'daily') due++
          else if (frequencyType === 'weekly' && (weekDays ?? []).includes(dow)) due++
        }

        if (due > 0) {
          const done = entries.filter(e => e.date === dateStr && e.status === 'completed').length
          map[dateStr] = { due, done }
        }
      }

      const result: Record<string, number> = {}
      for (const [date, { due, done }] of Object.entries(map)) {
        result[date] = done / due
      }
      setCompletionMap(result)
    }
    load()
  }, [year])

  // Build month label positions: for each month, find the week column of its first day
  const monthLabels: { month: number; col: number }[] = []
  for (let m = 0; m < 12; m++) {
    const first = new Date(year, m, 1)
    const colIndex = Math.floor((first.getTime() - gridStart.getTime()) / (7 * 86400000))
    if (colIndex >= 0 && colIndex < weeksCount) {
      monthLabels.push({ month: m, col: colIndex })
    }
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="px-4 py-6 overflow-x-auto">
      <h2 className="text-[#e7e9ea] font-semibold mb-4">{year}</h2>

      <div className="inline-block min-w-0">
        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: '28px' }}>
          {monthLabels.map(({ month, col }, idx) => {
            const nextCol = monthLabels[idx + 1]?.col ?? weeksCount
            const width = (nextCol - col) * 14
            return (
              <div
                key={month}
                className="text-[#71767b] text-[10px] shrink-0"
                style={{ width: `${width}px` }}
              >
                {MONTH_NAMES[month]}
              </div>
            )
          })}
        </div>

        <div className="flex gap-0.5">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="w-3 h-3 flex items-center justify-center text-[#536471] text-[9px]">
                {i % 2 === 1 ? d : ''}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {Array.from({ length: weeksCount }, (_, week) => (
            <div key={week} className="flex flex-col gap-0.5">
              {Array.from({ length: 7 }, (_, dow) => {
                const date = cells[week * 7 + dow]
                const dateStr = format(date, 'yyyy-MM-dd')
                const inYear = date.getFullYear() === year
                const ratio = inYear ? (completionMap[dateStr] ?? null) : null
                const isToday = dateStr === today

                return (
                  <button
                    key={dow}
                    onClick={() => onDayClick(date)}
                    title={`${dateStr}${ratio !== null ? ` · ${Math.round(ratio * 100)}%` : ''}`}
                    className="w-3 h-3 rounded-sm transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: inYear ? getColor(ratio) : 'transparent',
                      outline: isToday ? '1px solid #1d9bf0' : undefined,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[#536471] text-xs">Less</span>
          {[0, 0.3, 0.6, 1].map(v => (
            <div key={v} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(v) }} />
          ))}
          <span className="text-[#536471] text-xs">More</span>
        </div>
      </div>
    </div>
  )
}
