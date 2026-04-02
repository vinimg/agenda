import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  function translateError(err: string): string {
    if (err.includes('Invalid login credentials')) return 'Email ou senha incorretos'
    if (err.includes('Email not confirmed')) return 'Confirme seu email antes de entrar'
    if (err.includes('User already registered')) return 'Email já cadastrado. Tente entrar.'
    if (err.includes('Password should be at least')) return 'Senha deve ter pelo menos 6 caracteres'
    if (err.includes('Unable to validate email')) return 'Email inválido'
    if (err.includes('not configured')) return 'Serviço indisponível. Tente novamente.'
    return err
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (mode === 'login') {
      const err = await signIn(email, password)
      if (err) setError(translateError(err))
    } else {
      const err = await signUp(email, password)
      if (err) setError(translateError(err))
      else setSignupDone(true)
    }
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await resetPassword(email)
    if (err) setError(translateError(err))
    else setResetDone(true)
    setLoading(false)
  }

  if (resetMode) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-[#1d9bf0] text-5xl mb-3">◈</div>
            <h1 className="text-[#e7e9ea] text-2xl font-bold">Agenda</h1>
            <p className="text-[#71767b] text-sm mt-1">Recuperar senha</p>
          </div>
          {resetDone ? (
            <div className="bg-[#16181c] border border-[#2f3336] rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">📬</div>
              <p className="text-[#e7e9ea] text-sm font-medium mb-1">Email enviado</p>
              <p className="text-[#71767b] text-xs mb-4">Verifique sua caixa de entrada em <strong>{email}</strong></p>
              <button onClick={() => { setResetMode(false); setResetDone(false) }} className="text-[#1d9bf0] text-sm hover:underline">
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="bg-[#16181c] border border-[#2f3336] rounded-xl p-6 flex flex-col gap-4">
              <div>
                <label className="text-[#71767b] text-xs mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="voce@exemplo.com"
                  className="w-full bg-transparent border border-[#2f3336] rounded-lg px-3 py-2.5 text-[#e7e9ea] placeholder-[#536471] outline-none focus:border-[#1d9bf0] text-sm"
                />
              </div>
              {error && <p className="text-[#f4212e] text-xs bg-[#f4212e]/10 border border-[#f4212e]/20 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading} className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 text-white font-semibold py-2.5 rounded-full transition-colors">
                {loading ? '...' : 'Enviar link'}
              </button>
              <button type="button" onClick={() => { setResetMode(false); setError(null) }} className="text-center text-[#71767b] text-sm hover:underline">
                Voltar
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  if (signupDone) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[#16181c] border border-[#2f3336] rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <p className="text-[#e7e9ea] font-semibold mb-2">Verifique seu email</p>
          <p className="text-[#71767b] text-sm">Enviamos um link de confirmação para <strong>{email}</strong></p>
          <button
            onClick={() => { setSignupDone(false); setMode('login') }}
            className="mt-5 text-[#1d9bf0] text-sm hover:underline"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[#1d9bf0] text-5xl mb-3">◈</div>
          <h1 className="text-[#e7e9ea] text-2xl font-bold">Agenda</h1>
          <p className="text-[#71767b] text-sm mt-1">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#16181c] border border-[#2f3336] rounded-xl p-6 flex flex-col gap-4">
          <div>
            <label className="text-[#71767b] text-xs mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="voce@exemplo.com"
              className="w-full bg-transparent border border-[#2f3336] rounded-lg px-3 py-2.5 text-[#e7e9ea] placeholder-[#536471] outline-none focus:border-[#1d9bf0] text-sm"
            />
          </div>
          <div>
            <label className="text-[#71767b] text-xs mb-1.5 block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-transparent border border-[#2f3336] rounded-lg px-3 py-2.5 text-[#e7e9ea] placeholder-[#536471] outline-none focus:border-[#1d9bf0] text-sm"
            />
          </div>
          {error && (
            <p className="text-[#f4212e] text-xs bg-[#f4212e]/10 border border-[#f4212e]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 text-white font-semibold py-2.5 rounded-full transition-colors"
          >
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[#71767b] text-sm">
              {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                className="text-[#1d9bf0] hover:underline"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
              </button>
            </p>
            {mode === 'login' && (
              <button type="button" onClick={() => { setResetMode(true); setError(null) }} className="text-[#536471] text-xs hover:text-[#71767b] hover:underline">
                Esqueci minha senha
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
