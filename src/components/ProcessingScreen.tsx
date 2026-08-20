import { useEffect, useRef } from 'react'
import { CheckCircle2, Clock, FileText, PauseCircle, Plus, XCircle } from 'lucide-react'
import { SOURCE_TEXT } from '../lib/scenarios'
import type { Tab, TzFile } from '../lib/types'
import Button from './ui'
import Tabs, { SCREEN_TABS } from './Tabs'
import StatsTable from './StatsTable'
import SourceText from './SourceText'

interface Props {
  files: TzFile[]
  activeName: string
  progress: number // 0..100
  progressLabel: string
  objects: number
  actions: number
  checks: number
  logs: string[]
  elapsed: string
  tab: Tab
  onTabChange: (t: Tab) => void
  onCancel: () => void
  onUploadMore: (files: File[]) => void
}

function FileRow({ file, active }: { file: TzFile; active: boolean }) {
  return (
    <div className={`py-1 ${file.status === 'queued' ? 'opacity-70' : ''}`}>
      <div
        className={`flex items-center gap-1.5 text-[13px] ${
          active ? 'font-bold text-[#1A3C6E]' : 'text-[#6B7A8F]'
        }`}
      >
        <FileText size={15} strokeWidth={1.8} />
        <span className="truncate">{file.name}</span>
      </div>
      <div className="flex items-center gap-1.5 pl-[21px] text-[12px] text-[#6B7A8F]">
        {file.status === 'processing' && (
          <>
            <Clock size={12} /> Обработка... {Math.round(file.progress)}%
          </>
        )}
        {file.status === 'queued' && (
          <>
            <PauseCircle size={12} /> Ожидает очереди
          </>
        )}
        {file.status === 'done' && (
          <>
            <CheckCircle2 size={12} className="text-[#2E7D32]" /> Готово
          </>
        )}
        {file.status === 'error' && (
          <>
            <XCircle size={12} className="text-[#C62828]" /> Ошибка
          </>
        )}
      </div>
    </div>
  )
}

export default function ProcessingScreen({
  files,
  activeName,
  progress,
  progressLabel,
  objects,
  actions,
  checks,
  logs,
  elapsed,
  tab,
  onTabChange,
  onCancel,
  onUploadMore,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const activeFile = files.find((f) => f.status === 'processing' || f.status === 'error')

  // авто-скролл лога
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  return (
    <div className="flex h-full">
      {/* Левая колонка: загруженные ТЗ */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-[#D0D5DD] bg-white p-3">
        <div className="mb-2.5 text-[13px] font-bold text-[#1A3C6E]">Загруженные файлы</div>
        <div className="flex-1 overflow-auto">
          {files.map((f) => (
            <FileRow key={f.id} file={f} active={f.id === activeFile?.id} />
          ))}
        </div>
        <div className="mt-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => inputRef.current?.click()}
          >
            <Plus size={15} /> Загрузить ещё
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".doc,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const fs = Array.from(e.target.files ?? [])
              e.target.value = ''
              if (fs.length) onUploadMore(fs)
            }}
          />
        </div>
      </aside>

      {/* Правая колонка */}
      <section className="flex-1 overflow-auto bg-white p-5">
        <div className="flex flex-col gap-4">
          <Tabs tabs={SCREEN_TABS} active={tab} onChange={onTabChange} />

          {tab === 'editor' && (
            <>
              <div className="text-[14px] font-bold text-[#1A3C6E]">
                Обработка: {activeName}
              </div>

              {/* Прогресс-бар */}
              <div className="relative h-[20px] w-full overflow-hidden bg-[#E8ECF0]">
                <div className="h-full bg-[#1A3C6E]" style={{ width: `${progress}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-white">
                  {progress}% — {progressLabel}
                </span>
              </div>

              {/* Статус: 3 колонки */}
              <div className="grid grid-cols-3 border border-[#D0D5DD] bg-[#F8F9FA]">
                {[
                  ['Обнаружено объектов', objects],
                  ['Действий', actions],
                  ['Проверок', checks],
                ].map(([label, value], i) => (
                  <div
                    key={label}
                    className={`px-3 py-2.5 text-center text-[13px] text-[#1A2A3A] ${
                      i > 0 ? 'border-l border-[#D0D5DD]' : ''
                    }`}
                  >
                    {label}: {value}
                  </div>
                ))}
              </div>

              {/* Лог */}
              <div
                ref={logRef}
                className="h-[120px] overflow-auto border border-[#D0D5DD] bg-white p-2.5 font-mono text-[12px] leading-[18px] text-[#1A2A3A]"
              >
                {logs.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" onClick={onCancel}>
                  Отмена
                </Button>
              </div>
            </>
          )}

          {tab === 'source' && <SourceText text={SOURCE_TEXT} />}
          {tab === 'stats' && (
            <StatsTable
              rows={[
                { label: 'Файл технического задания', value: activeName || '—' },
                { label: 'Обнаружено объектов', value: objects },
                { label: 'Действий', value: actions },
                { label: 'Проверок', value: checks },
                { label: 'Сценариев сгенерировано', value: '—' },
                { label: 'Шагов Gherkin', value: '—' },
                { label: 'Время обработки', value: `${elapsed} сек` },
                { label: 'Размер выгрузки', value: '—' },
              ]}
            />
          )}
        </div>
      </section>
    </div>
  )
}
