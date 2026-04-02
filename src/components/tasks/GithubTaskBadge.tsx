import { ExternalLink } from 'lucide-react'
import type { Task } from '@/models'

interface Props { task: Task }

export function GithubTaskBadge({ task }: Props) {
  if (task.source !== 'github' || !task.githubRepo || !task.githubNumber) return null

  const ghUrl = `https://github.com/${task.githubRepo}/${task.githubType === 'issue' ? 'issues' : 'pull'}/${task.githubNumber}`

  return (
    <div className="flex items-center gap-2 mt-2">
      <a
        href={ghUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#2f3336] text-[#71767b] text-[10px] hover:border-[#71767b] transition-colors"
      >
        <span className="font-mono">GH #{task.githubNumber}</span>
        <ExternalLink size={9} />
      </a>
      <span className="text-[#536471] text-[10px]">{task.githubType === 'pr_review' ? 'PR' : 'Issue'}</span>
    </div>
  )
}
