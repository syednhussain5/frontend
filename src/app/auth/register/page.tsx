'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', password2: '', role: 'student',
  })
  const { register, isLoading } = useAuthStore()
  const router = useRouter()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password2) {
      toast.error('Passwords do not match')
      return
    }
    try {
      await register(form)
      toast.success('Account created! Welcome to QuizForge 🎉')
      router.push('/dashboard')
    } catch (err: any) {
      const data = err?.response?.data
      const msg = data
        ? Object.values(data).flat().join(' ')
        : 'Registration failed'
      toast.error(String(msg))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
            QuizForge ⚡
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm">Free forever · No credit card required</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="coollearner" value={form.username} onChange={set('username')} required />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input className="input" type="password" placeholder="Repeat password" value={form.password2} onChange={set('password2')} required />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary btn btn-md w-full py-3 text-base">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account…
              </span>
            ) : 'Create account →'}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
