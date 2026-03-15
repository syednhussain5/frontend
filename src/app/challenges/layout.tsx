'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'

const NAV_ITEMS = [
  { href: '/dashboard',    icon: '🏠', label: 'Dashboard'        },
  { href: '/quiz',         icon: '📚', label: 'Quizzes'          },
  { href: '/challenges',   icon: '⚡', label: 'Daily Challenge'  },
  { href: '/leaderboard',  icon: '🏆', label: 'Leaderboard'      },
  { href: '/profile',      icon: '👤', label: 'Profile'          },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, fetchMe, logout } = useAuthStore()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    if (!user) fetchMe()
  }, [isAuthenticated])

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => authApi.notifications().then((r) => r.data),
    enabled:  isAuthenticated,
    refetchInterval: 30_000,
  })

  const unreadCount = Array.isArray(notifs)
    ? notifs.filter((n: any) => !n.is_read).length
    : Array.isArray(notifs?.results)
    ? notifs.results.filter((n: any) => !n.is_read).length
    : 0

  if (!isAuthenticated) return null

  const xpProgress = user ? (user.xp % 500) / 500 * 100 : 0

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-5 fixed h-full z-40">
        <Link href="/dashboard" className="flex items-center gap-2 mb-8">
          <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
            QuizForge ⚡
          </span>
        </Link>

        {user && (
          <div className="card p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-600/30 border-2 border-brand-500/50 flex items-center justify-center text-lg font-bold text-brand-300">
                {user.username[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{user.username}</p>
                <p className="text-xs text-slate-500">Level {user.level} · {user.xp} XP</p>
              </div>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-600">LVL {user.level}</span>
              <span className="text-xs text-slate-600">LVL {user.level + 1}</span>
            </div>
            {user.current_streak > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                <span className="streak-flame">🔥</span>
                {user.current_streak} day streak
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-brand-600/20 text-brand-300 font-medium'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
                {item.href === '/dashboard' && unreadCount > 0 && (
                  <span className="ml-auto bg-brand-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}

          {user?.role === 'teacher' && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <span className="text-base">🎓</span>
              <span>Teacher Dashboard</span>
            </Link>
          )}
        </nav>

        <button
          onClick={() => { logout(); router.push('/') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all mt-4"
        >
          <span>🚪</span>
          <span>Sign out</span>
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 py-3 z-40">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                active ? 'text-brand-400' : 'text-slate-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}