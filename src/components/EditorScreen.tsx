import {
  CheckCircle2,
  CheckSquare,
  Download,
  Pencil,
  Plus,
  Save,
  Square,
  Trash2,
  Undo2,
} from 'lucide-react'
import {
  SOURCE_TEXT,
  buildFeature,
  countChangedLines,
  countSteps,
} from '../lib/scenarios'
import type { Scenario, Tab } from '../lib/types'
import Button from './ui'
import Tabs, { SCREEN_TABS } from './Tabs'
import CodeEditor from './CodeEditor'
import StatsTable from './StatsTable'
import SourceText from './SourceText'

interface Props {
  scenarios: Scenario[]
  activeId: string
  tab: Tab
  sourceName: string
  elapsed: string
  onTabChange: (t: Tab) => void
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onAdd: () => void
  onDeleteSelected: () => void
  onEdit: (id: string, text: string) => void
  onSave: () => void
  onRevert: () => void
  onExport: () => void
}

export default function EditorScreen({
  scenarios,
  activeId,
  tab,
  sourceName,
  elapsed,
  onTabChange,
  onSelect,
  onToggle,
  onAdd,
  onDeleteSelected,
  onEdit,
  onSave,
  onRevert,
  onExport,
}: Props) {
  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0]
  const selectedCount = scenarios.filter((s) => s.selected).length

  const exportScenarios = scenarios.filter((s) => s.selected)
  const used = exportScenarios.length ? exportScenarios : scenarios
  const featureSize = Math.max(
    1,
    Math.ceil(new Blob([buildFeature(used, sourceName)]).size / 1024),
  )

  const plural = (n: number) => {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return 'сценарий'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'сценария'
    return 'сценариев'
  }

  const changes = active ? countChangedLines(active.text, active.original) : 0
  const lines = active ? active.text.split('\n').length : 0
  const chip = !active
    ? null
    : active.saved
      ? { icon: CheckCircle2, text: 'Готов к выгрузке', cls: 'text-[#2E7D32]' }
      : changes > 0
        ? { icon: Pencil, text: 'Несохранённые правки', cls: 'text-[#F9A825]' }
        : { icon: CheckCircle2, text: 'Готов к выгрузке', cls: 'text-[#2E7D32]' }

  return (
    <div className="flex h-full">
      {/* Левая колонка: список сценариев */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-[#D0D5DD] bg-white p-3">
        <div className="text-[13px] font-bold text-[#1A3C6E]">Сценарии</div>
        <div className="mb-3 text-[11px] text-[#6B7A8F]">
          Всего: {scenarios.length} {plural(scenarios.length)}
        </div>

        <div className="flex-1 overflow-auto">
          {scenarios.map((s) => {
            const isActive = s.id === active?.id
            return (
              <div
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`flex cursor-pointer items-start gap-2 rounded-[2px] px-2 py-1.5 ${
                  isActive
                    ? 'bg-[#E8EEF4] font-bold text-[#1A3C6E]'
                    : 'text-[#1A2A3A] hover:bg-[#F5F5F5]'
                }`}
              >
                <span
                  className="mt-0.5 text-[#1A3C6E]"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(s.id)
                  }}
                >
                  {s.selected ? (
                    <CheckSquare size={16} strokeWidth={1.8} />
                  ) : (
                    <Square size={16} strokeWidth={1.8} />
                  )}
                </span>
                <span className="text-[13px] leading-snug">{s.title}</span>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-col gap-1">
          <Button variant="secondary" className="w-full" onClick={onAdd}>
            <Plus size={15} /> Добавить сценарий
          </Button>
          <Button
            variant="danger"
            className="w-full"
            disabled={selectedCount === 0}
            onClick={onDeleteSelected}
          >
            <Trash2 size={15} /> Удалить выбранные
          </Button>
        </div>
      </aside>

      {/* Правая колонка */}
      <section className="flex-1 overflow-auto bg-white p-5">
        <div className="flex flex-col gap-4">
          <Tabs tabs={SCREEN_TABS} active={tab} onChange={onTabChange} />

          {!active && (
            <div className="py-16 text-center text-[13px] text-[#6B7A8F]">
              Сценариев нет. Добавьте новый сценарий.
            </div>
          )}

          {active && tab === 'editor' && (
            <>
              {/* Заголовок сценария */}
              <div className="border-b border-[#D0D5DD] pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-[#1A3C6E]">{active.title}</span>
                  <span className={`flex items-center gap-1 text-[12px] ${chip.cls}`}>
                    <chip.icon size={14} strokeWidth={1.8} />
                    {chip.text}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-[#6B7A8F]">{active.basis}</div>
              </div>

              <CodeEditor
                id={active.id}
                text={active.text}
                original={active.original}
                onChange={(t) => onEdit(active.id, t)}
              />

              {/* Панель под редактором */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7A8F]">
                  Изменений: {changes} | Строк: {lines}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={onSave}>
                    <Save size={15} /> Сохранить
                  </Button>
                  <Button variant="primary" className="w-[180px]" onClick={onExport}>
                    <Download size={15} /> Выгрузить .feature
                  </Button>
                  <Button variant="secondary" onClick={onRevert}>
                    <Undo2 size={15} /> Отменить правки
                  </Button>
                </div>
              </div>
            </>
          )}

          {active && tab === 'source' && <SourceText text={SOURCE_TEXT} />}

          {active && tab === 'stats' && (
            <StatsTable
              rows={[
                { label: 'Файл технического задания', value: sourceName },
                { label: 'Обнаружено объектов', value: 12 },
                { label: 'Действий', value: 8 },
                { label: 'Проверок', value: 5 },
                { label: 'Сценариев', value: scenarios.length },
                { label: 'Шагов Gherkin', value: countSteps(scenarios) },
                { label: 'Время обработки', value: `${elapsed} сек` },
                { label: 'Размер выгрузки', value: `${featureSize} КБ` },
              ]}
            />
          )}
        </div>
      </section>
    </div>
  )
}
