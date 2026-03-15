'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

const FEATURES = [
  { icon: '🤖', title: 'AI-Generated Quizzes', desc: 'Gemini creates accurate, engaging questions from any topic or your own notes.' },
  { icon: '📈', title: 'Adaptive Difficulty', desc: 'Questions get harder as you improve—keeping you in the optimal learning zone.' },
  { icon: '🏆', title: 'Real-Time Leaderboards', desc: 'Compete live with friends and the global community.' },
  { icon: '🎮', title: 'Gamification', desc: 'XP, levels, badges, streaks, and daily challenges keep learning addictive.' },
  { icon: '🔁', title: 'Smart Revision', desc: 'Auto-generates quizzes from your wrong answers to close knowledge gaps.' },

]

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur border-b border-slate-800/60">
        <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
          QuizForge ⚡
        </span>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost btn btn-sm">Sign in</Link>
          <Link href="/auth/register" className="btn-primary btn btn-sm">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center relative">
        {/* Background glow */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-600/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative animate-slide-up">
          <span className="pill bg-brand-600/20 text-brand-300 mb-6 inline-flex">
            🚀 Powered by AI
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Learn anything.<br />
            <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-accent-400 bg-clip-text text-transparent">
              Faster than ever.
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            QuizForge generates adaptive AI-powered quizzes from any topic, tracks your weak areas, and makes learning feel like a game.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="btn-primary btn btn-lg w-full sm:w-auto animate-pulse-glow">
              Start learning for free →
            </Link>
            <Link href="/auth/login" className="btn-secondary btn btn-lg w-full sm:w-auto">
              Sign in
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-3 max-w-lg mx-auto gap-6 text-center animate-fade-in">
          {[['10K+', 'Quizzes Generated'], ['98%', 'Accuracy Rate'], ['50+', 'Topic Categories']].map(([val, label]) => (
            <div key={label}>
              <div className="text-3xl font-bold text-brand-300">{val}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need to master any subject</h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
          From AI generation to multiplayer battles — QuizForge is the complete learning platform.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-slate-100 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto card p-10">
          <h2 className="text-3xl font-bold mb-4">Ready to learn smarter?</h2>
          <p className="text-slate-400 mb-8">Join thousands of students already using QuizForge to ace their exams.</p>
          <Link href="/auth/register" className="btn-primary btn btn-lg">
            Create your free account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-600">
        © 2024 QuizForge · Built with Next.js, Django & Gemini AI
      </footer>
    </main>
  )
}
