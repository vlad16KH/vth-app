import { FileText, FolderOpen, Home, Settings, User } from 'lucide-react'

interface Props {
  userLogin?: string | null
  onHome: () => void
  onCabinet: () => void
  onLogout: () => void
}

export default function Header({ userLogin, onHome, onCabinet, onLogout }: Props) {
  return (
    <header className="h-[50px] shrink-0 border-b border-[#D0D5DD] bg-white">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative h-[30px] w-[30px] text-[#1A3C6E]">
            <Settings className="absolute left-0 top-0" size={28} strokeWidth={1.6} />
            <span className="absolute bottom-0 right-0 bg-white">
              <FileText size={15} strokeWidth={2.2} />
            </span>
          </div>
          {userLogin ? (
            <button onClick={onHome} className="cursor-pointer text-left">
              <span className="text-[16px] font-bold text-[#1A3C6E] hover:text-[#0F2A4A]">
                Vanessa Test Helper
              </span>
            </button>
          ) : (
            <span className="text-[16px] font-bold text-[#1A3C6E]">Vanessa Test Helper</span>
          )}
        </div>
        {userLogin && (
          <div className="flex items-center gap-4">
            <button
              onClick={onHome}
              className="flex cursor-pointer items-center gap-1.5 text-[13px] text-[#6B7A8F] hover:text-[#1A3C6E]"
            >
              <Home size={15} strokeWidth={1.8} />
              На главную
            </button>
            <button
              onClick={onCabinet}
              className="flex cursor-pointer items-center gap-1.5 text-[13px] text-[#6B7A8F] hover:text-[#1A3C6E]"
            >
              <FolderOpen size={15} strokeWidth={1.8} />
              Личный кабинет
            </button>
            <div className="h-[20px] w-px bg-[#D0D5DD]" />
            <button
              onClick={onCabinet}
              className="flex cursor-pointer items-center gap-2 text-left"
            >
              <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#E8EEF4] text-[#1A3C6E]">
                <User size={18} strokeWidth={1.8} />
              </span>
              <span className="text-[13px] text-[#1A2A3A] hover:text-[#1A3C6E]">{userLogin}</span>
            </button>
            <button
              onClick={onLogout}
              className="cursor-pointer text-[13px] text-[#6B7A8F] hover:text-[#1A3C6E]"
            >
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
