export type HistoryKind = 'tz' | 'scenario'

export interface HistoryItem {
  id: string
  kind: HistoryKind
  fileName: string
  size: number
  createdAt: string
  mimeType: string
  contentBase64: string
  sourceTzId?: string
}

export interface HistoryGroup {
  tz: HistoryItem
  scenarios: HistoryItem[]
}

const MAX_ITEMS = 80

function storageKey(login: string): string {
  return `vth.history.${login.toLowerCase()}`
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function mimeForFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'txt' || ext === 'feature') return 'text/plain;charset=utf-8'
  if (ext === 'doc') return 'application/msword'
  if (ext === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  return 'application/octet-stream'
}

export async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  return bytesToBase64(new Uint8Array(buf))
}

export function utf8ToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text))
}

export function loadHistory(login: string): HistoryItem[] {
  try {
    const raw = localStorage.getItem(storageKey(login))
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryItem[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => {
      if (
        !item ||
        typeof item.id !== 'string' ||
        (item.kind !== 'tz' && item.kind !== 'scenario') ||
        typeof item.fileName !== 'string' ||
        typeof item.size !== 'number' ||
        typeof item.createdAt !== 'string' ||
        typeof item.mimeType !== 'string' ||
        typeof item.contentBase64 !== 'string'
      ) {
        return false
      }
      if (item.sourceTzId !== undefined && typeof item.sourceTzId !== 'string') return false
      return true
    })
  } catch {
    return []
  }
}

function saveHistory(login: string, items: HistoryItem[]): boolean {
  if (items.length === 0) {
    localStorage.removeItem(storageKey(login))
    return true
  }
  let next = items.slice(0, MAX_ITEMS)
  while (next.length > 0) {
    try {
      localStorage.setItem(storageKey(login), JSON.stringify(next))
      return true
    } catch {
      next = next.slice(0, -1)
    }
  }
  return false
}

export function addHistoryItem(login: string, item: HistoryItem): HistoryItem[] {
  const items = [item, ...loadHistory(login)]
  saveHistory(login, items)
  return loadHistory(login)
}

export function removeHistoryItems(login: string, ids: string[]): HistoryItem[] {
  const idSet = new Set(ids)
  const remaining = loadHistory(login).filter((item) => {
    if (idSet.has(item.id)) return false
    if (item.kind === 'scenario' && item.sourceTzId && idSet.has(item.sourceTzId)) return false
    return true
  })
  saveHistory(login, remaining)
  return loadHistory(login)
}

export function clearHistory(login: string): HistoryItem[] {
  localStorage.removeItem(storageKey(login))
  return []
}

export function downloadHistoryItem(item: HistoryItem): void {
  const binary = atob(item.contentBase64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: item.mimeType || 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = item.fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function formatHistoryDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  return `${Math.max(1, Math.ceil(bytes / 1024))} КБ`
}

function timeOf(iso: string): number {
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

/** Группирует сценарии под ТЗ: по sourceTzId, иначе по времени загрузки. */
export function groupHistory(items: HistoryItem[]): {
  groups: HistoryGroup[]
  orphans: HistoryItem[]
} {
  const tzItems = items.filter((item) => item.kind === 'tz')
  const scenarios = items.filter((item) => item.kind === 'scenario')
  const tzIds = new Set(tzItems.map((item) => item.id))
  const byTz = new Map<string, HistoryItem[]>()
  for (const tz of tzItems) byTz.set(tz.id, [])

  const used = new Set<string>()
  for (const sc of scenarios) {
    if (sc.sourceTzId && tzIds.has(sc.sourceTzId)) {
      byTz.get(sc.sourceTzId)?.push(sc)
      used.add(sc.id)
    }
  }

  const tzByTime = [...tzItems].sort((a, b) => timeOf(a.createdAt) - timeOf(b.createdAt))
  const leftovers = scenarios.filter((sc) => !used.has(sc.id))
  for (const sc of leftovers) {
    const scTime = timeOf(sc.createdAt)
    let match: HistoryItem | undefined
    for (const tz of tzByTime) {
      if (timeOf(tz.createdAt) <= scTime) match = tz
    }
    if (match) {
      byTz.get(match.id)?.push(sc)
      used.add(sc.id)
    }
  }

  const groups = tzItems
    .map((tz) => ({
      tz,
      scenarios: [...(byTz.get(tz.id) ?? [])].sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt)),
    }))
    .sort((a, b) => timeOf(b.tz.createdAt) - timeOf(a.tz.createdAt))

  const orphans = leftovers.filter((sc) => !used.has(sc.id))
  return { groups, orphans }
}
