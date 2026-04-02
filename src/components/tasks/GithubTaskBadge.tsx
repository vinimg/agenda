import { ExternalLink } from 'lucide-react'
import type { Task } from '@/models'
import { useTaskStore } from '@/store/taskStore'

const MODEL_OPTIONS = [
  { value: 'claude', label: 'Claude', color: '#1d9bf0' },
  { value: 'codex',  label: 'Codex',  color: '#7856ff' },
  { value: 'gemini', label: 'Gemini', color: '#ffad1f' },
] as const

interface Props { task: Task }

export function GithubTaskBadge({ task }: Props) {
  const { update } = useTaskStore()
  if (task.source !== 'github' || !task.githubRepo || !task.githubNumber) return null

  const ghUrl = `https://github.com/${task.githubRepo}/${task.githubType === 'issue' ? 'issues' : 'pull'}/${task.githubNumber}`
  const model = task.preferredModel ?? 'claude'
  const isQueued = task.queuedForClaude ?? false

  function toggleQueue(m: 'claude' | 'codex' | 'gemini') {
    const next = isQueued && model === m ? { queuedForClaude: false } : { queuedForClaude: true, preferredModel: m }
    update(task.id!, next)
  }

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      <a
        href={ghUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#2f3336] text-[#71767b] text-[10px] hover:border-[#71767b] transition-colors"
      >
        <span className="font-mono">GH #{task.githubNumber}</span>
        <ExternalLink size={9} />
      </a>

      <span className="text-[#536471] text-[10px]">Resolver com:</span>

      {MODEL_OPTIONS.map(opt => {
        const active = isQueued && model === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => toggleQueue(opt.value as 'claude' | 'codex' | 'gemini')}
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors"
            style={{
              borderColor: active ? opt.color : '#2f3336',
              color: active ? opt.color : '#536471',
              backgroundColor: active ? opt.color + '18' : 'transparent',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
