import { CheckCircle2, Copy, Download, RotateCcw, X } from 'lucide-react'
import type { ExportInfo } from '../lib/types'
import Button from './ui'

interface Props {
  info: ExportInfo
  copied: boolean
  onClose: () => void
  onDownload: () => void
  onCopy: () => void
  onRestart: () => void
}

export default function SuccessModal({ info, copied, onClose, onDownload, onCopy, onRestart }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-[28px] top-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[540px] rounded-[2px] border border-[#D0D5DD] bg-white">
        {/* Заголовок */}
        <div className="flex h-[40px] items-center justify-between border-b border-[#D0D5DD] bg-[#F8F9FA] px-4">
          <span className="text-[14px] font-bold text-[#1A3C6E]">Выгрузка завершена</span>
          <button
            onClick={onClose}
            className="cursor-pointer text-[#6B7A8F] hover:text-[#1A3C6E]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex flex-col items-center gap-3 px-6 py-6">
          <CheckCircle2 size={48} strokeWidth={1.6} className="text-[#2E7D32]" />
          <div className="text-[16px] font-bold text-[#1A3C6E]">
            Файл сценариев успешно сгенерирован
          </div>
          <div className="font-mono text-[14px] text-[#1A2A3A]">{info.fileName}</div>

          <div className="grid w-full grid-cols-3 border border-[#D0D5DD] bg-[#F8F9FA]">
            {[
              ['Сценариев', info.scenarioCount],
              ['Шагов', info.steps],
              ['Размер', `${info.sizeKb} КБ`],
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

          <div className="text-[11px] text-[#6B7A8F]">
            Время обработки: {info.elapsed} сек | Правок в редакторе: {info.edits}
          </div>

          <div className="mt-3 flex gap-2">
            <Button variant="primary" className="w-[160px]" onClick={onDownload}>
              <Download size={15} /> Скачать .feature
            </Button>
            <Button variant="secondary" className="w-[150px]" onClick={onCopy}>
              <Copy size={15} /> {copied ? 'Скопировано' : 'Копировать в буфер'}
            </Button>
            <Button variant="secondary" className="w-[140px]" onClick={onRestart}>
              <RotateCcw size={15} /> Начать заново
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
