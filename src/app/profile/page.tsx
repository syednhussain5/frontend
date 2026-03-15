'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { analyticsApi, authApi, quizApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

function XPBar({ xp, level }: { xp: number; level: number }) {
  const progress = (xp % 500) / 500 * 100
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>Level {level}</span>
        <span>{xp % 500} / 500 XP</span>
        <span>Level {level + 1}</span>
      </div>
      <div className="xp-bar">
        <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuthStore()

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn:  () => analyticsApi.me().then((r) => r.data),
    enabled:  !!user,
  })

  const { data: attempts } = useQuery({
    queryKey: ['my-attempts'],
    queryFn:  () => quizApi.myAttempts().then((r) => r.data),
    enabled:  !!user,
  })

  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn:  () => authApi.badges().then((r) => r.data),
    enabled:  !!user,
  })

  const recentAttempts = Array.isArray(attempts)
    ? attempts.slice(0, 10)
    : attempts?.results?.slice(0, 10) ?? []

  const scoreHistory = analytics?.score_history ?? []
  const dailyActivity = analytics?.daily_activity ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Profile header */}
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-brand-600/30 border-2 border-brand-500 flex items-center justify-center text-4xl font-bold text-brand-300 shrink-0">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{user?.username}</h1>
            <span className="pill bg-brand-500/20 text-brand-300">{user?.role}</span>
          </div>
          {user?.bio && <p className="text-slate-400 text-sm mb-3">{user.bio}</p>}
          <XPBar xp={user?.xp ?? 0} level={user?.level ?? 1} />
        </div>
        <div className="grid grid-cols-2 gap-3 shrink-0">
          {[
            ['⚡', user?.xp ?? 0, 'Total XP'],
            ['📊', `${user?.accuracy ?? 0}%`, 'Accuracy'],
            ['🔥', user?.current_streak ?? 0, 'Streak'],
            ['📚', user?.total_quizzes_taken ?? 0, 'Quizzes'],
          ].map(([icon, val, label]) => (
            <div key={label as string} className="text-center">
              <div className="text-lg">{icon}</div>
              <div className="font-bold text-sm">{val}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score trend chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">📈 Score History</h2>
          {scoreHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={scoreHistory}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6271f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6271f1" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                />
                <Area
                  type="monotone" dataKey="score" name="Score %"
                  stroke="#6271f1" strokeWidth={2}
                  fill="url(#scoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              Complete quizzes to see your score trend
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">🏅 Badges</h2>
          {badges?.length ? (
            <div className="grid grid-cols-3 gap-3">
              {badges.map((b: any) => (
                <div
                  key={b.id}
                  title={`${b.name}: ${b.description}`}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                    b.earned
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-slate-800 opacity-30 grayscale'
                  }`}
                >
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-xs text-center text-slate-400 leading-tight">{b.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-6">
              Take quizzes to earn badges!
            </p>
          )}
        </div>
      </div>

      {/* Daily activity bar chart */}
      {dailyActivity.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">📅 Daily Activity (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
              />
              <Bar dataKey="quizzes" name="Quizzes" fill="#6271f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent attempts */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4">📝 Quiz History</h2>
        {recentAttempts.length ? (
          <div className="space-y-2">
            {recentAttempts.map((a: any) => (
              <Link
                key={a.id}
                href={a.status === 'completed' ? `/quiz/${a.quiz}/results?attempt=${a.id}` : `/quiz/${a.quiz}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  a.score >= 80 ? 'bg-green-500/20 text-green-400'
                  : a.score >= 60 ? 'bg-amber-500/20 text-amber-400'
                  : a.status === 'completed' ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-slate-700 text-slate-400'
                }`}>
                  {a.status === 'completed' ? `${Math.round(a.score)}%` : '…'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{a.quiz_title}</p>
                  <p className="text-xs text-slate-500">
                    {a.correct_count}/{a.total_questions} correct ·{' '}
                    {formatDistanceToNow(new Date(a.started_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-xs text-brand-400 shrink-0">+{a.xp_earned} XP</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            <div className="text-3xl mb-2">📭</div>
            No quiz history yet · <Link href="/quiz" className="text-brand-400">Browse quizzes</Link>
          </div>
        )}
      </div>
    </div>
  )
}
