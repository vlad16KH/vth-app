export interface AuthUser {
  login: string
}

interface StoredUser {
  login: string
  password: string
}

export type RegisterResult = { ok: true; user: AuthUser } | { ok: false; error: string }

const SESSION_KEY = 'vth.auth'
const USERS_KEY = 'vth.users'

const SEED_USERS: StoredUser[] = [{ login: 'admin', password: 'admin' }]

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return [...SEED_USERS]
    const parsed = JSON.parse(raw) as StoredUser[]
    if (!Array.isArray(parsed)) return [...SEED_USERS]
    const users = parsed.filter(
      (u) => u && typeof u.login === 'string' && typeof u.password === 'string',
    )
    const logins = new Set(users.map((u) => u.login.toLowerCase()))
    for (const seed of SEED_USERS) {
      if (!logins.has(seed.login.toLowerCase())) users.push(seed)
    }
    return users
  } catch {
    return [...SEED_USERS]
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function saveSession(user: AuthUser): AuthUser {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (parsed && typeof parsed.login === 'string' && parsed.login.trim()) {
      return { login: parsed.login }
    }
    return null
  } catch {
    return null
  }
}

export function login(loginValue: string, password: string): AuthUser | null {
  const name = loginValue.trim()
  const user = loadUsers().find(
    (u) => u.login.toLowerCase() === name.toLowerCase() && u.password === password,
  )
  if (!user) return null
  return saveSession({ login: user.login })
}

export function register(loginValue: string, password: string, confirm: string): RegisterResult {
  const name = loginValue.trim()
  if (name.length < 3) return { ok: false, error: 'Логин должен содержать не менее 3 символов' }
  if (/\s/.test(name)) return { ok: false, error: 'Логин не должен содержать пробелы' }
  if (password.length < 4) return { ok: false, error: 'Пароль должен содержать не менее 4 символов' }
  if (password !== confirm) return { ok: false, error: 'Пароли не совпадают' }

  const users = loadUsers()
  if (users.some((u) => u.login.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: 'Пользователь с таким логином уже зарегистрирован' }
  }

  users.push({ login: name, password })
  saveUsers(users)
  return { ok: true, user: saveSession({ login: name }) }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}
