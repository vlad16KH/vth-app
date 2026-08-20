import { useEffect, useRef } from 'react'
import { getChangedLineIndexes } from '../lib/scenarios'

interface Props {
  id: string
  text: string
  original: string
  onChange: (text: string) => void
}

/** Редактор кода с номерами строк, подсветкой изменённых строк и скрытым textarea-слоем ввода */
export default function CodeEditor({ id, text, original, onChange }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lines = text.split('\n')
  const changed = getChangedLineIndexes(text, original)

  // Курсор на строке 10 (как в макете), пока текст не изменён
  useEffect(() => {
    const ta = taRef.current
    if (!ta || text !== original) return
    const ls = text.split('\n')
    const target = Math.min(9, Math.max(0, ls.length - 1))
    let pos = 0
    for (let i = 0; i < target; i++) pos += ls[i].length + 1
    ta.setSelectionRange(pos, pos)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    if (preRef.current) {
      preRef.current.scrollTop = el.scrollTop
      preRef.current.scrollLeft = el.scrollLeft
    }
    if (gutterRef.current) gutterRef.current.scrollTop = el.scrollTop
  }

  return (
    <div className="relative h-[360px] overflow-hidden border border-[#D0D5DD] bg-white">
      {/* Номера строк */}
      <div
        ref={gutterRef}
        className="absolute bottom-0 left-0 top-0 w-[36px] select-none overflow-hidden border-r border-[#D0D5DD] bg-[#F5F5F5] pr-1.5 text-right font-mono text-[12px] leading-[20px] text-[#6B7A8F]"
      >
        {lines.map((_, i) => (
          <div
            key={i}
            className={changed.has(i) ? 'bg-[#FFF9C4] font-bold text-[#1A3C6E]' : ''}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Отображение текста (изменённые строки подсвечены) */}
      <pre
        ref={preRef}
        className="absolute bottom-0 left-[36px] right-0 top-0 m-0 overflow-hidden font-mono text-[13px] leading-[20px] text-[#1A2A3A]"
      >
        {lines.map((l, i) => (
          <div key={i} className={changed.has(i) ? 'bg-[#FFF9C4]' : ''}>
            {l || '\u00A0'}
          </div>
        ))}
      </pre>

      {/* Слой ввода */}
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        wrap="off"
        spellCheck={false}
        style={{ caretColor: '#1A3C6E', color: 'transparent', padding: 0 }}
        className="absolute bottom-0 left-[36px] right-0 top-0 m-0 resize-none overflow-auto whitespace-pre border-0 bg-transparent font-mono text-[13px] leading-[20px] outline-none"
      />
    </div>
  )
}
