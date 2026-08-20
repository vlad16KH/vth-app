export interface TabItem {
  id: string
  label: string
}

export const SCREEN_TABS: TabItem[] = [
  { id: 'editor', label: 'Редактор сценариев' },
  { id: 'source', label: 'Исходный текст' },
  { id: 'stats', label: 'Статистика' },
]

interface Props {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
}

export default function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex border-b border-[#D0D5DD]">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`-mb-px h-[36px] cursor-pointer border-b-2 px-4 text-[13px] ${
            active === t.id
              ? 'border-[#1A3C6E] font-bold text-[#1A3C6E]'
              : 'border-transparent text-[#6B7A8F] hover:text-[#1A3C6E]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
