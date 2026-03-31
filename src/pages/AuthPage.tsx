import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'

export function AuthPage() {
  const { signIn, signUp } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (mode === 'login') {
      const err = await signIn(email, password)
      if (err) setError(err)
    } else {
      const err = await signUp(email, password)
      if (err) setError(err)
      else setSignupDone(true)
    }
    setLoading(false)
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
          <p className="text-center text-[#71767b] text-sm">
            {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
              className="text-[#1d9bf0] hover:underline"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
