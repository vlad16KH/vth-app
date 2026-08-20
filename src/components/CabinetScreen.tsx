import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CornerDownRight, Download, FileText, ScrollText, Trash2 } from 'lucide-react'
import type { HistoryGroup, HistoryItem } from '../lib/history'
import { formatFileSize, formatHistoryDate, groupHistory } from '../lib/history'
import Button from './ui'

interface Props {
  login: string
  items: HistoryItem[]
  onDownload: (item: HistoryItem) => void
  onDelete: (ids: string[]) => void
  onClearAll: () => void
  onBack: () => void
}

const checkClass = 'h-[14px] w-[14px] shrink-0 accent-[#1A3C6E]'

function fileWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'файл'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'файла'
  return 'файлов'
}

function FileMeta({ item }: { item: HistoryItem }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="truncate font-mono text-[13px] text-[#1A2A3A]">{item.fileName}</div>
      <div className="mt-0.5 text-[11px] text-[#6B7A8F]">
        {formatHistoryDate(item.createdAt)} · {formatFileSize(item.size)}
      </div>
    </div>
  )
}

function DownloadBtn({ item, onDownload }: { item: HistoryItem; onDownload: (item: HistoryItem) => void }) {
  return (
    <Button variant="secondary" className="h-[28px] shrink-0 px-3" onClick={() => onDownload(item)}>
      <Download size={14} /> Скачать
    </Button>
  )
}

function DeleteBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="secondary"
      className="h-[28px] shrink-0 px-3 text-[#C62828] hover:bg-[#FEF2F2]"
      title={label}
      onClick={onClick}
    >
      <Trash2 size={14} />
    </Button>
  )
}

function HistoryGroupCard({
  tz,
  scenarios,
  selected,
  onToggle,
  onDownload,
  onDeleteIds,
}: {
  tz: HistoryItem
  scenarios: HistoryItem[]
  selected: Set<string>
  onToggle: (ids: string[], next: boolean) => void
  onDownload: (item: HistoryItem) => void
  onDeleteIds: (ids: string[], message: string) => void
}) {
  const groupIds = [tz.id, ...scenarios.map((item) => item.id)]
  const selectedCount = groupIds.filter((id) => selected.has(id)).length
  const allSelected = selectedCount === groupIds.length
  const someSelected = selectedCount > 0 && !allSelected

  const deleteTz = () => {
    const extra = scenarios.length ? ' и связанные файлы-сценарии' : ''
    onDeleteIds(groupIds, `Удалить техническое задание «${tz.fileName}»${extra} из истории?`)
  }

  return (
    <article className="overflow-hidden rounded-[2px] border border-[#D0D5DD] bg-white">
      <div className="flex items-center gap-3 border-l-[3px] border-[#1A3C6E] bg-[#F8F9FA] px-4 py-3">
        <input
          type="checkbox"
          className={checkClass}
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected
          }}
          onChange={(e) => onToggle(groupIds, e.target.checked)}
          aria-label={`Выбрать ${tz.fileName}`}
        />
        <FileText size={18} strokeWidth={1.6} className="shrink-0 text-[#1A3C6E]" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#6B7A8F]">
            Техническое задание
          </div>
          <FileMeta item={tz} />
        </div>
        <DownloadBtn item={tz} onDownload={onDownload} />
        <DeleteBtn label="Удалить ТЗ и связанные сценарии" onClick={deleteTz} />
      </div>

      <div className="border-t border-[#D0D5DD] bg-white px-4 py-3">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#6B7A8F]">
          Связанные файлы-сценарии
          {scenarios.length > 0 ? ` · ${scenarios.length}` : ''}
        </div>
        {scenarios.length === 0 ? (
          <div className="flex items-start gap-2 pl-1 text-[13px] text-[#6B7A8F]">
            <CornerDownRight size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#B0B8C4]" />
            Сценарии по этому ТЗ ещё не выгружались
          </div>
        ) : (
          <ul className="relative ml-2 border-l border-[#D0D5DD] pl-4">
            {scenarios.map((item) => (
              <li key={item.id} className="relative flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <span className="absolute -left-4 top-1/2 h-px w-3 bg-[#D0D5DD]" />
                <input
                  type="checkbox"
                  className={checkClass}
                  checked={selected.has(item.id)}
                  onChange={(e) => onToggle([item.id], e.target.checked)}
                  aria-label={`Выбрать ${item.fileName}`}
                />
                <CornerDownRight size={15} strokeWidth={1.8} className="shrink-0 text-[#1A3C6E]" />
                <ScrollText size={16} strokeWidth={1.6} className="shrink-0 text-[#1A3C6E]" />
                <FileMeta item={item} />
                <DownloadBtn item={item} onDownload={onDownload} />
                <DeleteBtn
                  label="Удалить файл-сценарий"
                  onClick={() =>
                    onDeleteIds([item.id], `Удалить файл «${item.fileName}» из истории?`)
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

export default function CabinetScreen({
  login,
  items,
  onDownload,
  onDelete,
  onClearAll,
  onBack,
}: Props) {
  const tzItems = items.filter((item) => item.kind === 'tz')
  const scenarioItems = items.filter((item) => item.kind === 'scenario')
  const { groups, orphans } = groupHistory(items)
  const allIds = useMemo(() => items.map((item) => item.id), [items])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const valid = new Set(allIds)
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => valid.has(id)))
      if (next.size === prev.size) {
        let same = true
        for (const id of prev) {
          if (!next.has(id)) same = false
        }
        if (same) return prev
      }
      return next
    })
  }, [allIds])

  const toggle = (ids: string[], next: boolean) => {
    setSelected((prev) => {
      const copy = new Set(prev)
      for (const id of ids) {
        if (next) copy.add(id)
        else copy.delete(id)
      }
      return copy
    })
  }

  const idsForDelete = (ids: string[], grouped: HistoryGroup[]) => {
    const result = new Set(ids)
    for (const group of grouped) {
      if (result.has(group.tz.id)) {
        for (const sc of group.scenarios) result.add(sc.id)
      }
    }
    return [...result]
  }

  const deleteIds = (ids: string[], message: string) => {
    if (!ids.length) return
    if (!window.confirm(message)) return
    onDelete(idsForDelete(ids, groups))
  }

  const deleteSelected = () => {
    const ids = idsForDelete([...selected], groups)
    deleteIds(ids, `Удалить выбранные записи из истории (${ids.length} ${fileWord(ids.length)})?`)
  }

  const clearAll = () => {
    if (!window.confirm('Очистить всю историю загрузок и выгрузок? Это действие нельзя отменить.')) {
      return
    }
    onClearAll()
  }

  const hasItems = items.length > 0

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex w-full max-w-[900px] flex-col px-4 py-8">
        <Button variant="secondary" className="w-fit px-3" onClick={onBack}>
          <ArrowLeft size={15} /> Назад
        </Button>
        <h1 className="mt-4 text-[18px] font-bold text-[#1A3C6E]">Личный кабинет</h1>
        <p className="mt-1.5 text-[13px] text-[#6B7A8F]">
          История загрузок технических заданий и выгруженных файлов-сценариев пользователя{' '}
          <span className="font-bold text-[#1A2A3A]">{login}</span>
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-[2px] border border-[#D0D5DD] bg-white px-4 py-3">
            <FileText size={20} strokeWidth={1.6} className="text-[#1A3C6E]" />
            <div>
              <div className="text-[18px] font-bold text-[#1A3C6E]">{tzItems.length}</div>
              <div className="text-[11px] text-[#6B7A8F]">Загружено ТЗ</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[2px] border border-[#D0D5DD] bg-white px-4 py-3">
            <ScrollText size={20} strokeWidth={1.6} className="text-[#1A3C6E]" />
            <div>
              <div className="text-[18px] font-bold text-[#1A3C6E]">{scenarioItems.length}</div>
              <div className="text-[11px] text-[#6B7A8F]">Выгружено сценариев</div>
            </div>
          </div>
        </div>

        <section className="mt-8 pb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-bold text-[#1A3C6E]">История преобразований</h2>
              <p className="mt-1 text-[13px] text-[#6B7A8F]">
                Каждый блок — техническое задание и полученные из него файлы-сценарии
              </p>
            </div>
            {hasItems && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="h-[28px] px-3"
                  disabled={selected.size === 0}
                  onClick={deleteSelected}
                >
                  <Trash2 size={14} /> Удалить выбранные
                </Button>
                <Button variant="danger" className="h-[28px] px-3" onClick={clearAll}>
                  <Trash2 size={14} /> Очистить всю историю
                </Button>
              </div>
            )}
          </div>

          {groups.length === 0 && orphans.length === 0 ? (
            <div className="mt-2 border border-[#D0D5DD] bg-white px-3 py-8 text-center text-[13px] text-[#6B7A8F]">
              Пока нет загруженных технических заданий
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {groups.map((group) => (
                <HistoryGroupCard
                  key={group.tz.id}
                  tz={group.tz}
                  scenarios={group.scenarios}
                  selected={selected}
                  onToggle={toggle}
                  onDownload={onDownload}
                  onDeleteIds={deleteIds}
                />
              ))}
              {orphans.length > 0 && (
                <article className="overflow-hidden rounded-[2px] border border-[#D0D5DD] bg-white">
                  <div className="border-b border-[#D0D5DD] bg-[#F8F9FA] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7A8F]">
                    Сценарии без привязки к ТЗ
                  </div>
                  <ul className="px-4 py-2">
                    {orphans.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 border-t border-[#D0D5DD] py-2 first:border-t-0"
                      >
                        <input
                          type="checkbox"
                          className={checkClass}
                          checked={selected.has(item.id)}
                          onChange={(e) => toggle([item.id], e.target.checked)}
                          aria-label={`Выбрать ${item.fileName}`}
                        />
                        <ScrollText size={16} strokeWidth={1.6} className="shrink-0 text-[#1A3C6E]" />
                        <FileMeta item={item} />
                        <DownloadBtn item={item} onDownload={onDownload} />
                        <DeleteBtn
                          label="Удалить файл-сценарий"
                          onClick={() =>
                            deleteIds([item.id], `Удалить файл «${item.fileName}» из истории?`)
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </article>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
