import { FileText, Folder } from 'lucide-react'
import { SPRINT_REPO_MOCK } from '@/src/ai-build-sprint-content'

/**
 * RepoMock — the "code and docs, yours" visual: a plain repository view drawn on
 * the same 960x600 canvas as the product mocks, so it sits in FittedMock.
 */
export function RepoMock() {
  const { files, readmeTitle, readmeLines } = SPRINT_REPO_MOCK
  return (
    <div className="grid h-full w-full grid-cols-[340px_1fr] bg-surface-base font-body text-ink">
      <div className="border-r border-line-subtle bg-surface-raised p-6">
        <ul className="space-y-4">
          {files.map((file) => (
            <li key={file} className="flex items-center gap-3 text-[22px]">
              {file.endsWith('/') ? (
                <Folder size={24} className="text-brand-violet-strong" aria-hidden />
              ) : (
                <FileText size={24} className="text-ink-tertiary" aria-hidden />
              )}
              <span className={file.endsWith('/') ? 'font-medium' : 'text-ink-secondary'}>{file}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-10">
        <p className="font-mono text-[18px] text-ink-tertiary">{readmeTitle}</p>
        <div className="mt-6 space-y-7">
          {readmeLines.map((line, i) => (
            <div key={line}>
              <p className="font-display text-[34px] font-semibold tracking-tight">{line}</p>
              <div className="mt-3 space-y-2" aria-hidden>
                <span className="block h-2.5 rounded-full bg-surface-overlay" style={{ width: `${88 - i * 9}%` }} />
                <span className="block h-2.5 rounded-full bg-surface-overlay" style={{ width: `${64 + i * 6}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
