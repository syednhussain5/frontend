'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { analyticsApi, quizApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role === 'student') {
      router.replace('/dashboard')
    }
  }, [user, router])

  const { data: teacherAnalytics, isLoading } = useQuery({
    queryKey: ['teacher-analytics'],
    queryFn:  () => analyticsApi.teacher().then((r) => r.data),
    enabled:  user?.role === 'teacher' || user?.role === 'admin',
  })

  const { data: myQuizzes } = useQuery({
    queryKey: ['my-quizzes'],
    queryFn:  () => quizApi.list({ my: 'true' }).then((r) => r.data),
    enabled:  !!user,
  })

  const quizzes = Array.isArray(myQuizzes) ? myQuizzes : myQuizzes?.results ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🎓 Teacher Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage quizzes and track student performance</p>
        </div>
        <Link href="/quiz/create" className="btn-primary btn btn-md">+ Create Quiz</Link>
      </div>

      {/* Overview stats */}
      {teacherAnalytics && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ['📚', teacherAnalytics.total_quizzes_created, 'Quizzes Created'],
            ['▶',  teacherAnalytics.total_attempts,        'Total Attempts'],
            ['👥', quizzes.length,                         'Active Quizzes'],
          ].map(([icon, val, label]) => (
            <div key={label as string} className="stat-card">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="stat-value">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz performance table */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4">📊 Quiz Performance</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : teacherAnalytics?.quiz_stats?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800">
                  <th className="pb-3 font-medium">Quiz</th>
                  <th className="pb-3 font-medium">Topic</th>
                  <th className="pb-3 font-medium text-right">Plays</th>
                  <th className="pb-3 font-medium text-right">Avg Score</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {teacherAnalytics.quiz_stats.map((q: any) => (
                  <tr key={q.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-medium truncate max-w-[180px]">{q.title}</td>
                    <td className="py-3 text-slate-400">{q.topic}</td>
                    <td className="py-3 text-right">{q.play_count}</td>
                    <td className="py-3 text-right">
                      <span className={
                        q.average_score >= 80 ? 'text-green-400'
                        : q.average_score >= 60 ? 'text-amber-400'
                        : 'text-rose-400'
                      }>
                        {q.average_score.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/quiz/${q.id}`} className="text-brand-400 hover:text-brand-300 text-xs">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">
            <div className="text-3xl mb-2">📭</div>
            <p>No quizzes created yet</p>
            <Link href="/quiz/create" className="text-brand-400 mt-2 inline-block">Create your first quiz</Link>
          </div>
        )}
      </div>

      {/* All my quizzes */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4">📚 My Quizzes</h2>
        <div className="space-y-2">
          {quizzes.map((q: any) => (
            <div key={q.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/40">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{q.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`pill ${
                    q.status === 'ready' ? 'pill-ready'
                    : q.status === 'generating' ? 'pill-generating'
                    : 'pill-failed'
                  }`}>{q.status}</span>
                  <span className="text-xs text-slate-500">{q.topic}</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 shrink-0">{q.play_count} plays</div>
              <Link href={`/quiz/${q.id}`} className="btn-secondary btn btn-sm">Open</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
