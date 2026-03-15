'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { analyticsApi, challengesApi } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

function StatCard({ icon, value, label, sub }: {
  icon: string; value: string | number; label: string; sub?: string
}) {
  return (
    <div className="stat-card card-hover">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-xs text-brand-400 mt-1">{sub}</div>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton h-6 w-8 mb-2" />
      <div className="skeleton h-8 w-24 mb-1" />
      <div className="skeleton h-4 w-16" />
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn:  () => analyticsApi.me().then((r) => r.data),
    enabled:  !!user,
  })

  const { data: challenge } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn:  () => challengesApi.today().then((r) => r.data).catch(() => null),
  })

  const overview = analytics?.overview

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Good {getTimeOfDay()},{' '}
            <span className="text-brand-300">{user?.username}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {user?.current_streak
              ? `🔥 ${user.current_streak} day streak — keep it up!`
              : 'Take a quiz to start your streak!'}
          </p>
        </div>
        <Link href="/quiz/create" className="btn-primary btn btn-md hidden sm:flex">
          ✨ New Quiz
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon="📊" value={overview?.total_quizzes ?? 0}        label="Quizzes Taken"         />
            <StatCard icon="🎯" value={`${overview?.overall_accuracy ?? 0}%`} label="Overall Accuracy"     />
            <StatCard icon="⚡" value={overview?.xp ?? 0}                    label="Total XP"  sub={`Level ${overview?.level}`} />
            <StatCard icon="🔥" value={overview?.current_streak ?? 0}        label="Day Streak"            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Challenge */}
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚡</span>
            <h2 className="font-semibold">Daily Challenge</h2>
          </div>
          {challenge ? (
            <div>
              <p className="text-sm text-slate-400 mb-1">{challenge.challenge.quiz.topic}</p>
              <p className="font-medium mb-3">{challenge.challenge.quiz.title}</p>
              <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                <span>⏱ {challenge.challenge.quiz.time_limit_minutes}m</span>
                <span>👥 {challenge.challenge.total_participants} attempts</span>
              </div>
              {challenge.challenge.completed_by_user ? (
                <div className="pill bg-green-500/15 text-green-400">✓ Completed today</div>
              ) : (
                <Link
                  href={`/quiz/${challenge.challenge.quiz.id}`}
                  className="btn-primary btn btn-sm w-full justify-center"
                >
                  Accept challenge →
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-sm">
              <div className="text-3xl mb-2">🎯</div>
              No challenge today yet
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/quiz/create',  icon: '🤖', title: 'AI Quiz',      desc: 'Generate from any topic'  },
              { href: '/quiz',         icon: '📚', title: 'Browse Quizzes', desc: 'Explore public quizzes'  },
              { href: '/quiz/revision',icon: '🔁', title: 'Smart Revision', desc: 'Review your weak areas'  },
             
            ].map((a) => (
              <Link key={a.href} href={a.href}
                className="card card-hover p-4 flex items-start gap-3"
              >
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Weak topics + Score history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak topics */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">📉 Areas to Improve</h2>
          {analytics?.weak_topics?.length ? (
            <div className="space-y-3">
              {analytics.weak_topics.map((t: any) => (
                <div key={t.topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{t.topic}</span>
                    <span className={t.accuracy < 50 ? 'text-rose-400' : 'text-amber-400'}>
                      {t.accuracy}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${t.accuracy}%`,
                        background: t.accuracy < 50
                          ? 'linear-gradient(90deg,#ef4444,#f87171)'
                          : 'linear-gradient(90deg,#f59e0b,#fbbf24)',
                      }}
                    />
                  </div>
                </div>
              ))}
              <Link href="/quiz/revision" className="btn-secondary btn btn-sm w-full mt-2 justify-center">
                🔁 Generate revision quiz
              </Link>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              <div className="text-3xl mb-2">🌟</div>
              Take more quizzes to see insights
            </div>
          )}
        </div>

        {/* Score history mini-list */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">📈 Recent Scores</h2>
            <Link href="/profile" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {analytics?.score_history?.length ? (
            <div className="space-y-2">
              {[...analytics.score_history].reverse().slice(0, 6).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500 w-12 shrink-0">{s.date}</span>
                  <div className="flex-1 progress-bar h-2">
                    <div
                      className="progress-fill h-2"
                      style={{
                        width: `${s.score}%`,
                        background: s.score >= 80
                          ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                          : s.score >= 60
                          ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                          : 'linear-gradient(90deg,#ef4444,#f87171)',
                      }}
                    />
                  </div>
                  <span className={`w-10 text-right font-medium ${
                    s.score >= 80 ? 'text-green-400' : s.score >= 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}>{s.score}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              <div className="text-3xl mb-2">📝</div>
              No quiz history yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
