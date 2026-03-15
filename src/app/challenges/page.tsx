'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { challengesApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function ChallengesPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn:  () => challengesApi.today().then((r) => r.data).catch(() => null),
  })

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">⚡ Daily Challenge</h1>
        <p className="text-slate-500 text-sm mt-1">
          New challenge every day · Extra XP for completing it
        </p>
      </div>

      {data?.challenge ? (
        <>
          {/* Challenge card */}
          <div className="card p-6 border border-brand-500/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="pill bg-amber-500/20 text-amber-400">📅 Today</span>
              <span className="text-slate-500 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h2 className="text-xl font-bold mb-2">{data.challenge.quiz.title}</h2>
            <p className="text-slate-400 text-sm mb-4">{data.challenge.quiz.topic}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                ['❓', data.challenge.quiz.question_count, 'Questions'],
                ['⏱',  data.challenge.quiz.time_limit_minutes
                  ? `${data.challenge.quiz.time_limit_minutes}m` : '∞', 'Time'],
                ['👥', data.challenge.total_participants, 'Attempts'],
              ].map(([icon, val, label]) => (
                <div key={label as string} className="text-center card p-3">
                  <div className="text-lg">{icon}</div>
                  <div className="font-bold">{val}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>

            {data.challenge.completed_by_user ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                  <p className="text-green-400 font-medium">✅ Completed today!</p>
                  <p className="text-xs text-slate-500 mt-1">Come back tomorrow for a new challenge</p>
                </div>
              </div>
            ) : (
              <Link
                href={`/quiz/${data.challenge.quiz.id}`}
                className="btn-primary btn btn-lg w-full justify-center"
              >
                ⚡ Accept Challenge
              </Link>
            )}
          </div>

          {/* Leaderboard */}
          {data.leaderboard?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold mb-4">🏆 Today's Rankings</h2>
              <div className="space-y-2">
                {data.leaderboard.map((entry: any) => (
                  <div
                    key={entry.username}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      entry.username === user?.username
                        ? 'bg-brand-600/15 border border-brand-500/40'
                        : 'bg-slate-800/50'
                    }`}
                  >
                    <span className="w-6 text-center text-sm">
                      {entry.rank <= 3 ? RANK_MEDALS[entry.rank - 1] : `#${entry.rank}`}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-sm font-bold text-brand-300 shrink-0">
                      {entry.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 font-medium text-sm">{entry.username}</div>
                    <div className="text-sm font-bold text-amber-400">{entry.score.toFixed(0)}%</div>
                    <div className="text-xs text-brand-400">+{entry.xp_earned} XP</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold mb-2">No Challenge Today Yet</h2>
          <p className="text-slate-400 text-sm mb-6">
            Daily challenges are generated fresh each day. Check back soon!
          </p>
          <Link href="/quiz" className="btn-primary btn btn-md">
            Browse other quizzes
          </Link>
        </div>
      )}
    </div>
  )
}
