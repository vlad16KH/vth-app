import { useRef, useState } from 'react'
import { CloudUpload, FileCheck, FileDown, FileSearch } from 'lucide-react'
import Button from './ui'

interface Props {
  onFiles: (files: File[]) => void
}

function StepCard({ icon: Icon, number, title, desc }: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; number: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-[2px] border border-[#D0D5DD] bg-white px-4 py-5">
      <span className="flex h-[32px] w-[32px] items-center justify-center rounded-[2px] bg-[#1A3C6E] text-[14px] font-bold text-white">
        {number}
      </span>
      <Icon size={22} strokeWidth={1.5} className="text-[#1A3C6E]" />
      <span className="text-[13px] font-bold text-[#1A3C6E]">{title}</span>
      <span className="text-center text-[11px] leading-snug text-[#6B7A8F]">{desc}</span>
    </div>
  )
}

export default function UploadScreen({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const handlePick = (list: FileList | null) => {
    const fs = Array.from(list ?? [])
    if (fs.length) onFiles(fs)
  }

  return (
    <div className="flex h-full justify-center overflow-auto">
      <div className="flex w-[600px] flex-col items-center pt-[60px]">
        {/* Заголовок */}
        <h1 className="text-center text-[18px] font-bold text-[#1A3C6E]">
          Преобразование технического задания в сценарии Vanessa Automation
        </h1>
        <p className="mt-1.5 text-center text-[13px] text-[#6B7A8F]">
          Загрузите техническое задание и получите готовые .feature-файлы
        </p>

        {/* Блок «Как это работает» */}
        <div className="mt-8 grid w-full grid-cols-3 gap-4">
          <StepCard
            icon={FileSearch}
            number="1"
            title="Загрузите файл"
            desc="Выберите файл .doc, .docx или .txt. Допускается до 10 МБ."
          />
          <StepCard
            icon={FileCheck}
            number="2"
            title="Проверьте сценарии"
            desc="ИИ распознаёт объекты и действия. Отредактируйте при необходимости."
          />
          <StepCard
            icon={FileDown}
            number="3"
            title="Экспортируйте"
            desc="Скачайте готовый .feature-файл для Vanessa Automation."
          />
        </div>

        {/* Область загрузки */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            handlePick(e.dataTransfer.files)
          }}
          className={`mt-8 flex h-[280px] w-full flex-col items-center justify-center gap-3 rounded-[2px] border-2 border-dashed bg-[#F8F9FA] transition-colors ${
            over ? 'border-[#1A3C6E] bg-[#E8EEF4]' : 'border-[#B0B8C4]'
          }`}
        >
          <CloudUpload
            size={48}
            strokeWidth={1.5}
            className={`transition-colors ${over ? 'text-[#1A3C6E]' : 'text-[#6B7A8F]'}`}
          />
          <div className="text-[14px] text-[#1A3C6E]">Перетащите файл сюда</div>
          <div className="text-[13px] text-[#6B7A8F]">или</div>
          <Button variant="primary" className="w-[200px]" onClick={() => inputRef.current?.click()}>
            Выбрать файл
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".doc,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              handlePick(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {/* Информационная строка */}
        <div className="mt-6 flex w-full items-center justify-between rounded-[2px] border border-[#D0D5DD] bg-[#F8F9FA] px-4 py-2.5">
          <span className="text-[11px] text-[#6B7A8F]">
            Поддерживаемые форматы: .doc, .docx, .txt
          </span>
          <span className="text-[11px] text-[#6B7A8F]">Максимальный размер: 10 МБ</span>
        </div>
      </div>
    </div>
  )
}