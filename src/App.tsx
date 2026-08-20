import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  buildScenarios,
  buildFeature,
  countChangedLines,
  countSteps,
  featureFileName,
  progressLabel,
  timeStamp,
} from './lib/scenarios'
import type { ErrorInfo, ExportInfo, Scenario, Screen, Tab, TzFile } from './lib/types'
import type { AuthUser, RegisterResult } from './lib/auth'
import { loadSession, login, logout, register } from './lib/auth'
import type { HistoryItem } from './lib/history'
import {
  addHistoryItem,
  clearHistory,
  downloadHistoryItem,
  fileToBase64,
  loadHistory,
  mimeForFileName,
  removeHistoryItems,
  utf8ToBase64,
} from './lib/history'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import LoginScreen from './components/LoginScreen'
import UploadScreen from './components/UploadScreen'
import ProcessingScreen from './components/ProcessingScreen'
import EditorScreen from './components/EditorScreen'
import CabinetScreen from './components/CabinetScreen'
import SuccessModal from './components/SuccessModal'
import ErrorModal from './components/ErrorModal'

/* ----- константы ----- */
const SUPPORTED_EXT = ['doc', 'docx', 'txt']
const MAX_SIZE = 10 * 1024 * 1024
const BROKEN_RE = /error|broken|поврежд/i

let idSeq = 0
const uid = () => `f${++idSeq}-${Date.now()}`

/* ----- утилита для точки в статусной строке ----- */
function Dot({ color, pulse, label }: { color: string; pulse?: boolean; label: string }) {
  return (
    <>
      <span
        className={`inline-block h-[8px] w-[8px] rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`}
      />
      {label}
    </>
  )
}

/* ----- компонент ----- */
export default function App() {
  /* ------ состояние ------ */
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [screen, setScreen] = useState<Screen>('upload')
  const [files, setFiles] = useState<TzFile[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [activeScenarioId, setActiveScenarioId] = useState('')
  const [tab, setTab] = useState<Tab>('editor')
  const [successModal, setSuccessModal] = useState<ExportInfo | null>(null)
  const [errorModal, setErrorModal] = useState<ErrorInfo | null>(null)
  const [sourceFileName, setSourceFileName] = useState('')
  const [elapsedSec, setElapsedSec] = useState('0.0')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [cabinetFrom, setCabinetFrom] = useState<Screen>('upload')
  const [activeTzHistoryId, setActiveTzHistoryId] = useState('')

  /* ------ рефы для синхронизации внутри интервала ------ */
  const filesRef = useRef(files)
  const logsRef = useRef(logs)
  const startTimeRef = useRef(0)
  const tzHistoryByFileIdRef = useRef<Record<string, string>>({})

  useEffect(() => {
    filesRef.current = files
  }, [files])
  useEffect(() => {
    logsRef.current = logs
  }, [logs])

  useEffect(() => {
    const session = loadSession()
    setUser(session)
    if (session) setHistory(loadHistory(session.login))
    setAuthReady(true)
  }, [])

  /* ------ сброс ------ */
  const resetAll = () => {
    // если в редакторе есть несохранённые правки — спрашиваем подтверждение
    const hasUnsaved = scenarios.some((s) => !s.saved && s.text !== s.original)
    if (screen === 'editor' && hasUnsaved && !window.confirm('Есть несохранённые правки. Вернуться на главный экран?')) {
      return
    }
    setScreen('upload')
    setFiles([])
    setLogs([])
    setScenarios([])
    setActiveScenarioId('')
    setTab('editor')
    setSuccessModal(null)
    setErrorModal(null)
    setSourceFileName('')
    setElapsedSec('0.0')
    startTimeRef.current = 0
    setActiveTzHistoryId('')
    tzHistoryByFileIdRef.current = {}
  }

  const handleLogin = (loginValue: string, password: string) => {
    const session = login(loginValue, password)
    if (!session) return false
    setUser(session)
    setHistory(loadHistory(session.login))
    return true
  }

  const handleRegister = (loginValue: string, password: string, confirm: string): RegisterResult => {
    const result = register(loginValue, password, confirm)
    if (result.ok) {
      setUser(result.user)
      setHistory(loadHistory(result.user.login))
    }
    return result
  }

  const handleLogout = () => {
    const hasUnsaved = scenarios.some((s) => !s.saved && s.text !== s.original)
    if (screen === 'editor' && hasUnsaved && !window.confirm('Есть несохранённые правки. Выйти из системы?')) {
      return
    }
    logout()
    setUser(null)
    setHistory([])
    setScreen('upload')
    setFiles([])
    setLogs([])
    setScenarios([])
    setActiveScenarioId('')
    setTab('editor')
    setSuccessModal(null)
    setErrorModal(null)
    setSourceFileName('')
    setElapsedSec('0.0')
    startTimeRef.current = 0
    setActiveTzHistoryId('')
    tzHistoryByFileIdRef.current = {}
  }

  /* ------ файлы: добавление ------ */
  const handleFiles = (list: File[]) => {
    for (const file of list) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!SUPPORTED_EXT.includes(ext)) {
        setErrorModal({
          title: 'Ошибка обработки',
          message: 'Не удалось обработать файл',
          detail: `Неподдерживаемый формат: .${ext || '?'}\nИспользуйте .doc, .docx или .txt`,
          hints: ['Поддерживаемые форматы: .doc, .docx, .txt', 'Максимальный размер: 10 МБ'],
        })
        return
      }
      if (file.size > MAX_SIZE) {
        setErrorModal({
          title: 'Ошибка обработки',
          message: 'Файл превышает максимальный размер',
          detail: 'Размер файла больше 10 МБ.\nПожалуйста, выберите файл меньшего размера.',
          hints: ['Поддерживаемые форматы: .doc, .docx, .txt', 'Максимальный размер: 10 МБ'],
        })
        return
      }
      const f: TzFile = { id: uid(), name: file.name, size: file.size, status: 'queued', progress: 0 }
      filesRef.current = [...filesRef.current, f]
      setFiles(filesRef.current)
      if (user) {
        const historyId = uid()
        tzHistoryByFileIdRef.current[f.id] = historyId
        void persistTzUpload(user.login, file, historyId)
      }
    }

    // запускаем первый файл, если ничего не обрабатывается
    const hasRunning = filesRef.current.some(
      (x) => x.status === 'processing' || x.status === 'done',
    )
    if (!hasRunning) {
      const first = filesRef.current.find((x) => x.status === 'queued')
      if (first) {
        if (!startTimeRef.current) startTimeRef.current = Date.now()
        startFile(first.id)
        setScreen('processing')
      }
    }
  }

  /* ------ запуск обработки одного файла ------ */
  const startFile = (id: string) => {
    const target = filesRef.current.find((f) => f.id === id)
    if (!target) return

    // проверка на «повреждённый» файл (для демонстрации ошибки)
    if (BROKEN_RE.test(target.name)) {
      const next = filesRef.current.map((f) =>
        f.id === id ? { ...f, status: 'error' as const } : f,
      )
      filesRef.current = next
      setFiles(next)
      setErrorModal({
        title: 'Ошибка обработки',
        message: 'Не удалось обработать файл',
        detail: 'Файл повреждён или не содержит текста.\nПроверьте формат и содержимое документа.',
        hints: ['Поддерживаемые форматы: .doc, .docx, .txt', 'Максимальный размер: 10 МБ'],
        onRetry: () => retryFile(id),
      })
      return
    }

    const next = filesRef.current.map((f) =>
      f.id === id ? { ...f, status: 'processing' as const, progress: 0 } : f,
    )
    filesRef.current = next
    setFiles(next)
    setLogs((l) => [...l, `[${timeStamp()}] Начало обработки файла: ${target.name}`])
  }

  const retryFile = (id: string) => {
    setErrorModal(null)
    startFile(id)
  }

  /* ------ тик симуляции обработки (интервал) ------ */
  const tickRef = useRef<() => void>(() => {})

  tickRef.current = () => {
    const f = filesRef.current.find((x) => x.status === 'processing')
    if (!f) return

    const np = Math.min(100, f.progress + 4 + Math.random() * 7)
    const newLogs = [...logsRef.current]
    const push = (msg: string) => newLogs.push(`[${timeStamp()}] ${msg}`)

    if (f.progress < 5 && np >= 5) push('Распознан раздел «Цель»')
    if (f.progress < 25 && np >= 25) push('Найдено 5 объектов метаданных')
    if (f.progress < 40 && np >= 40) push('Генерация сценариев...')
    if (f.progress < 55 && np >= 55) push('Создано 3 сценария Gherkin')
    if (f.progress < 70 && np >= 70) push('Формирование .feature-файла...')
    if (np >= 100) push('Обработка завершена успешно')

    logsRef.current = newLogs
    setLogs(newLogs)

    const done = np >= 100
    const next = filesRef.current.map((x) =>
      x.id === f.id
        ? { ...x, progress: np, status: (done ? 'done' : 'processing') as TzFile['status'] }
        : x,
    )
    filesRef.current = next
    setFiles(next)

    if (done) {
      const queued = next.find((x) => x.status === 'queued')
      if (queued) {
        // запускаем следующий в очереди
        const promoted = next.map((x) =>
          x.id === queued.id
            ? { ...x, status: 'processing' as const, progress: 0 }
            : x,
        )
        filesRef.current = promoted
        setFiles(promoted)
        setLogs((l) => [...l, `[${timeStamp()}] Начало обработки файла: ${queued.name}`])
      } else {
        // все файлы обработаны → переходим в редактор
        const last = [...next]
          .reverse()
          .find((x) => x.status === 'done')
        if (last) {
          const sc = buildScenarios(last.name)
          setScenarios(sc)
          setActiveScenarioId(sc[0]?.id ?? '')
          setSourceFileName(last.name)
          setActiveTzHistoryId(tzHistoryByFileIdRef.current[last.id] ?? '')
          setElapsedSec(((Date.now() - startTimeRef.current) / 1000).toFixed(1))
          setScreen('editor')
        }
      }
    }
  }

  useEffect(() => {
    if (screen !== 'processing') return
    const id = window.setInterval(() => tickRef.current(), 320)
    return () => window.clearInterval(id)
  }, [screen])

  const persistTzUpload = async (login: string, file: File, historyId: string) => {
    try {
      const contentBase64 = await fileToBase64(file)
      setHistory(
        addHistoryItem(login, {
          id: historyId,
          kind: 'tz',
          fileName: file.name,
          size: file.size,
          createdAt: new Date().toISOString(),
          mimeType: mimeForFileName(file.name),
          contentBase64,
        }),
      )
    } catch {
      /* файл не сохранился в историю — обработка не прерывается */
    }
  }

  const persistScenarioExport = (login: string, fileName: string, featureText: string) => {
    const size = new Blob([featureText]).size
    setHistory(
      addHistoryItem(login, {
        id: uid(),
        kind: 'scenario',
        fileName,
        size,
        createdAt: new Date().toISOString(),
        mimeType: mimeForFileName(fileName),
        contentBase64: utf8ToBase64(featureText),
        sourceTzId: activeTzHistoryId || undefined,
      }),
    )
  }

  const openCabinet = () => {
    if (screen === 'cabinet') return
    setCabinetFrom(screen)
    setSuccessModal(null)
    setErrorModal(null)
    setScreen('cabinet')
  }

  const closeCabinet = () => {
    setScreen(cabinetFrom === 'cabinet' ? 'upload' : cabinetFrom)
  }

  /* ------ обработка сценариев ------ */
  const handleEdit = (id: string, text: string) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, text, saved: false } : s)))
  }

  const handleSave = () => {
    setScenarios((prev) => prev.map((s) => (s.id === activeScenarioId ? { ...s, saved: true } : s)))
  }

  const handleRevert = () => {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id === activeScenarioId ? { ...s, text: s.original, saved: true } : s,
      ),
    )
  }

  const handleToggle = (id: string) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)))
  }

  const handleAdd = () => {
    const n = scenarios.length + 1
    const body =
      '# Сценарий: Новый сценарий\n\nДано: Заданы исходные данные\n\nКогда: Выполняется действие\n\nТогда: Получен ожидаемый результат'
    const sc: Scenario = {
      id: uid(),
      title: `Сценарий ${n}: Новый сценарий`,
      basis: 'Основание: добавлен вручную',
      original: body,
      text: body,
      selected: true,
      saved: true,
    }
    setScenarios((prev) => [...prev, sc])
    setActiveScenarioId(sc.id)
  }

  const handleDeleteSelected = () => {
    const next = scenarios.filter((s) => !s.selected)
    if (next.length > 0 && !next.some((s) => s.id === activeScenarioId)) {
      setActiveScenarioId(next[0].id)
    }
    setScenarios(next)
  }

  /* ------ экспорт ------ */
  const handleExport = () => {
    const list = scenarios.filter((s) => s.selected)
    const used = list.length ? list : scenarios
    const featureText = buildFeature(used, sourceFileName || 'техническое задание')
    const fileName = featureFileName()
    const steps = countSteps(used)
    const sizeKb = Math.max(1, Math.ceil(new Blob([featureText]).size / 1024))
    const edits = scenarios.reduce((n, s) => n + countChangedLines(s.text, s.original), 0)
    setSuccessModal({
      fileName,
      featureText,
      scenarioCount: used.length,
      steps,
      sizeKb,
      elapsed: elapsedSec,
      edits,
    })
    if (user) persistScenarioExport(user.login, fileName, featureText)
  }

  const handleDownload = () => {
    if (!successModal) return
    const blob = new Blob([successModal.featureText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = successModal.fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleCopy = async () => {
    if (!successModal) return
    try {
      await navigator.clipboard.writeText(successModal.featureText)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = successModal.featureText
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* ignore */
      }
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ------ клавиатурные сокращения ------ */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (screen !== 'editor' || successModal) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleExport()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  /* ------ производные данные для рендера ------ */
  const activeFile = files.find(
    (f) => f.status === 'processing' || (f.status === 'error' && !!errorModal),
  )
  const progress = activeFile?.status === 'processing' ? activeFile.progress : 0
  const liveElapsed =
    startTimeRef.current && screen === 'processing'
      ? ((Date.now() - startTimeRef.current) / 1000).toFixed(1)
      : elapsedSec

  /* ------ статусная строка ------ */
  let left: ReactNode = ''
  let right: ReactNode = ''

  if (!user) {
    left = 'Требуется авторизация'
    right = <span className="text-[11px] text-[#9AA8B8]">Версия 0.1.0</span>
  } else if (screen === 'cabinet') {
    left = 'Личный кабинет'
    right = <span className="text-[11px] text-[#9AA8B8]">Версия 0.1.0</span>
  } else if (screen === 'upload') {
    left = 'Готов к загрузке'
    right = <span className="text-[11px] text-[#9AA8B8]">Версия 0.1.0</span>
  } else if (screen === 'processing') {
    if (errorModal) {
      left = 'Ошибка: не удалось прочитать файл'
      right = <Dot color="bg-[#C62828]" label="Ошибка" />
    } else {
      left = `Обработка: ${activeFile?.name ?? ''} (${Math.round(progress)}%)`
      right = <Dot color="bg-[#1A3C6E]" pulse label="Выполняется" />
    }
  } else if (screen === 'editor') {
    if (successModal) {
      left = 'Готово. Файл выгружен успешно'
      right = <Dot color="bg-[#2E7D32]" label="Успешно" />
    } else {
      const activeSc = scenarios.find((s) => s.id === activeScenarioId)
      const idx = activeSc ? scenarios.indexOf(activeSc) + 1 : 0
      const total = scenarios.length
      const lines = activeSc ? activeSc.text.split('\n').length : 0
      const changes = activeSc ? countChangedLines(activeSc.text, activeSc.original) : 0
      left = `Сценарий ${idx} из ${total} | Строк: ${lines} | Изменений: ${changes}`
      right = 'F1 — Справка | Ctrl+S — Сохранить | Ctrl+Enter — Выгрузить'
    }
  }

  if (!authReady) {
    return <div className="h-screen bg-[#F5F5F5]" />
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F5F5F5] font-sans text-[13px] text-[#1A2A3A]">
      <Header userLogin={user?.login} onHome={resetAll} onCabinet={openCabinet} onLogout={handleLogout} />

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-[1280px]">
          {!user && <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />}

          {user && screen === 'upload' && <UploadScreen onFiles={handleFiles} />}

          {user && screen === 'cabinet' && (
            <CabinetScreen
              login={user.login}
              items={history}
              onDownload={downloadHistoryItem}
              onDelete={(ids) => setHistory(removeHistoryItems(user.login, ids))}
              onClearAll={() => setHistory(clearHistory(user.login))}
              onBack={closeCabinet}
            />
          )}

          {user && screen === 'processing' && (
            <ProcessingScreen
              files={files}
              activeName={activeFile?.name ?? ''}
              progress={Math.round(progress)}
              progressLabel={progressLabel(progress)}
              objects={Math.round(12 * (progress / 100))}
              actions={Math.round(8 * (progress / 100))}
              checks={Math.round(5 * (progress / 100))}
              logs={logs}
              elapsed={liveElapsed}
              tab={tab}
              onTabChange={setTab}
              onCancel={resetAll}
              onUploadMore={handleFiles}
            />
          )}

          {user && screen === 'editor' && (
            <EditorScreen
              scenarios={scenarios}
              activeId={activeScenarioId}
              tab={tab}
              sourceName={sourceFileName}
              elapsed={elapsedSec}
              onTabChange={setTab}
              onSelect={setActiveScenarioId}
              onToggle={handleToggle}
              onAdd={handleAdd}
              onDeleteSelected={handleDeleteSelected}
              onEdit={handleEdit}
              onSave={handleSave}
              onRevert={handleRevert}
              onExport={handleExport}
            />
          )}
        </div>
      </main>

      <StatusBar left={left} right={right} />

      {/* Модалки */}
      {successModal && (
        <SuccessModal
          info={successModal}
          copied={copied}
          onClose={() => setSuccessModal(null)}
          onDownload={handleDownload}
          onCopy={handleCopy}
          onRestart={resetAll}
        />
      )}

      {errorModal && (
        <ErrorModal
          info={errorModal}
          onClose={() => setErrorModal(null)}
          onChooseAnother={() => {
            setErrorModal(null)
            resetAll()
          }}
        />
      )}
    </div>
  )
}