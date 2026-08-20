import type { ReactNode } from 'react'

interface Props {
  left: ReactNode
  right: ReactNode
}

export default function StatusBar({ left, right }: Props) {
  return (
    <footer className="h-[28px] shrink-0 border-t border-[#D0D5DD] bg-white">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 text-[12px] text-[#6B7A8F]">
        <span>{left}</span>
        <span className="flex items-center gap-1.5">{right}</span>
      </div>
    </footer>
  )
}
