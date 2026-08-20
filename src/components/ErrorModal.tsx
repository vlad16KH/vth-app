import { RotateCcw, Upload, X, XCircle } from 'lucide-react'
import type { ErrorInfo } from '../lib/types'
import Button from './ui'

interface Props {
  info: ErrorInfo
  onClose: () => void
  onChooseAnother: () => void
}

export default function ErrorModal({ info, onClose, onChooseAnother }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-[28px] top-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[480px] rounded-[2px] border-2 border-[#C62828] bg-white">
        {/* Заголовок */}
        <div className="flex h-[40px] items-center justify-between border-b border-[#C62828] bg-[#FEF2F2] px-4">
          <span className="text-[14px] font-bold text-[#C62828]">{info.title}</span>
          <button onClick={onClose} className="cursor-pointer text-[#6B7A8F] hover:text-[#C62828]">
            <X size={16} />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex flex-col items-center gap-3 px-6 py-6">
          <XCircle size={48} strokeWidth={1.6} className="text-[#C62828]" />
          <div className="text-[16px] font-bold text-[#1A2A3A]">{info.message}</div>

          <div className="w-full whitespace-pre-line border border-[#FEF2F2] bg-[#FFF5F5] px-3 py-3 text-center text-[13px] leading-snug text-[#1A2A3A]">
            {info.detail}
          </div>

          <div className="text-[11px] leading-relaxed text-[#6B7A8F]">
            {info.hints.map((h) => (
              <div key={h}>{h}</div>
            ))}
          </div>

          <div className="mt-3 flex w-full justify-end gap-2">
            {info.onRetry && (
              <Button variant="secondary" onClick={info.onRetry}>
                <RotateCcw size={15} /> Попробовать снова
              </Button>
            )}
            <Button variant="primary" onClick={onChooseAnother}>
              <Upload size={15} /> Загрузить другой файл
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
