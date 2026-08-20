import { useState, type FormEvent } from 'react'
import { Lock, User } from 'lucide-react'
import Button from './ui'
import type { RegisterResult } from '../lib/auth'

type Mode = 'login' | 'register'

interface Props {
  onLogin: (login: string, password: string) => boolean
  onRegister: (login: string, password: string, confirm: string) => RegisterResult
}

const inputClass =
  'h-[36px] w-full rounded-[2px] border border-[#D0D5DD] bg-white pl-9 pr-3 text-[13px] text-[#1A2A3A] outline-none focus:border-[#1A3C6E]'

export default function LoginScreen({ onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setPassword('')
    setConfirm('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'login') {
      if (!loginValue.trim() || !password) {
        setError('Введите логин и пароль')
        return
      }
      const ok = onLogin(loginValue, password)
      if (!ok) setError('Неверный логин или пароль')
      return
    }

    const result = onRegister(loginValue, password, confirm)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="flex h-full items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-[400px] rounded-[2px] border border-[#D0D5DD] bg-white px-8 py-8"
      >
        <h1 className="text-center text-[18px] font-bold text-[#1A3C6E]">
          {mode === 'login' ? 'Вход в систему' : 'Регистрация'}
        </h1>
        <p className="mt-1.5 text-center text-[13px] text-[#6B7A8F]">
          {mode === 'login'
            ? 'Введите логин и пароль для продолжения'
            : 'Создайте учётную запись, чтобы пользоваться системой'}
        </p>

        <label className="mt-6 block text-[13px] font-bold text-[#1A3C6E]">Логин</label>
        <div className="relative mt-1.5">
          <User
            size={15}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A8F]"
          />
          <input
            autoFocus
            autoComplete="username"
            value={loginValue}
            onChange={(e) => {
              setLoginValue(e.target.value)
              setError('')
            }}
            className={inputClass}
            placeholder="Логин"
          />
        </div>

        <label className="mt-4 block text-[13px] font-bold text-[#1A3C6E]">Пароль</label>
        <div className="relative mt-1.5">
          <Lock
            size={15}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A8F]"
          />
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            className={inputClass}
            placeholder="Пароль"
          />
        </div>

        {mode === 'register' && (
          <>
            <label className="mt-4 block text-[13px] font-bold text-[#1A3C6E]">Повторите пароль</label>
            <div className="relative mt-1.5">
              <Lock
                size={15}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A8F]"
              />
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value)
                  setError('')
                }}
                className={inputClass}
                placeholder="Повторите пароль"
              />
            </div>
          </>
        )}

        {error && (
          <div className="mt-3 border border-[#FEF2F2] bg-[#FFF5F5] px-3 py-2 text-[13px] text-[#C62828]">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" className="mt-6 w-full">
          {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </Button>

        {mode === 'login' ? (
          <p className="mt-4 text-center text-[13px] text-[#6B7A8F]">
            Нет аккаунта?{' '}
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="cursor-pointer font-bold text-[#1A3C6E] hover:text-[#0F2A4A]"
            >
              Зарегистрироваться
            </button>
          </p>
        ) : (
          <p className="mt-4 text-center text-[13px] text-[#6B7A8F]">
            Уже есть аккаунт?{' '}
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="cursor-pointer font-bold text-[#1A3C6E] hover:text-[#0F2A4A]"
            >
              Войти
            </button>
          </p>
        )}

        {mode === 'login' && (
          <p className="mt-3 text-center text-[11px] text-[#9AA8B8]">Демо-доступ: admin / admin</p>
        )}
      </form>
    </div>
  )
}
