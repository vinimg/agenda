import type { Habit, HabitEntry, HabitAttribute } from '@/models'

export const ATTRIBUTES: Record<HabitAttribute, { label: string; emoji: string; color: string }> = {
  strength:     { label: 'Força',         emoji: '💪', color: '#f4212e' },
  intelligence: { label: 'Inteligência',  emoji: '🧠', color: '#7856ff' },
  discipline:   { label: 'Disciplina',    emoji: '⚡', color: '#ffad1f' },
  wellness:     { label: 'Bem-estar',     emoji: '🧘', color: '#00ba7c' },
  social:       { label: 'Social',        emoji: '🤝', color: '#1d9bf0' },
  creativity:   { label: 'Criatividade',  emoji: '🎨', color: '#ff7a00' },
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000]
const TITLES = ['Novato', 'Aprendiz', 'Iniciado', 'Experiente', 'Mestre', 'Lenda']

export interface AttributeStat {
  attribute: HabitAttribute
  xp: number
  level: number        // 1-based
  progress: number     // 0-1 within current level
  label: string
  emoji: string
  color: string
}

export interface CharacterStats {
  overallLevel: number
  title: string
  activeAttributes: AttributeStat[]
}

function xpToLevel(xp: number): { level: number; progress: number } {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else {
      const prev = LEVEL_THRESHOLDS[i - 1]
      const next = LEVEL_THRESHOLDS[i]
      return { level, progress: (xp - prev) / (next - prev) }
    }
  }
  return { level, progress: 1 }
}

export function computeCharacterStats(habits: Habit[], entries: HabitEntry[]): CharacterStats {
  const xpByAttr: Partial<Record<HabitAttribute, number>> = {}

  for (const entry of entries) {
    if (entry.status !== 'completed') continue
    const habit = habits.find(h => h.id === entry.habitId)
    if (!habit?.attribute) continue
    const streakBonus = Math.min(habit.currentStreak ?? 0, 10)
    xpByAttr[habit.attribute] = (xpByAttr[habit.attribute] ?? 0) + 10 + streakBonus
  }

  // Determine active attributes = attributes that have at least 1 habit
  const activeAttrSet = new Set<HabitAttribute>()
  for (const h of habits) {
    if (h.attribute && h.isActive) activeAttrSet.add(h.attribute)
  }

  const activeAttributes: AttributeStat[] = Array.from(activeAttrSet).map(attr => {
    const xp = xpByAttr[attr] ?? 0
    const { level, progress } = xpToLevel(xp)
    return { attribute: attr, xp, level, progress, ...ATTRIBUTES[attr] }
  })

  const levels = activeAttributes.map(a => a.level)
  const overallLevel = levels.length > 0
    ? Math.max(1, Math.floor(levels.reduce((s, l) => s + l, 0) / levels.length))
    : 1
  const titleIdx = Math.min(overallLevel - 1, TITLES.length - 1)

  return { overallLevel, title: TITLES[titleIdx], activeAttributes }
}
