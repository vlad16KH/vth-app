export type Screen = 'upload' | 'processing' | 'editor' | 'cabinet'

export type Tab = 'editor' | 'source' | 'stats'

export type FileStatus = 'queued' | 'processing' | 'done' | 'error'

export interface TzFile {
  id: string
  name: string
  size: number // bytes
  status: FileStatus
  progress: number // 0..100
}

export interface Scenario {
  id: string
  title: string
  basis: string
  original: string
  text: string
  selected: boolean
  saved: boolean
}

export interface ErrorInfo {
  title: string
  message: string
  detail: string
  hints: string[]
  onRetry?: () => void
}

export interface ExportInfo {
  fileName: string
  featureText: string
  scenarioCount: number
  steps: number
  sizeKb: number
  elapsed: string
  edits: number
}
