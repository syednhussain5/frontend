'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { LeaderboardEntry } from '@/types'
import clsx from 'clsx'

const SORT_OPTIONS = [
  { value: 'xp',       label: '⚡ XP'        },
  { value: 'quizzes',  label: '📚 Quizzes'   },
  { value: 'streak',   label: '🔥 Streak'    },
]

const RANK_MEDALS = ['🥇', '🥈', '🥉']

function LeaderboardRow({ entry, rank, isMe }: {
  entry: LeaderboardEntry; rank: number; isMe: boolean
}) {
  return (
    <div className={clsx(
      'flex items-center gap-4 p-4 rounded-xl border transition-all',
      isMe
        ? 'bg-brand-600/15 border-brand-500/50'
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    )}>
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {rank <= 3
          ? <span className="text-xl">{RANK_MEDALS[rank - 1]}</span>
          : <span className="text-slate-500 font-mono text-sm">#{rank}</span>
        }
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-brand-600/30 border-2 border-slate-700 flex items-center justify-center text-lg font-bold text-brand-300 shrink-0">
        {entry.username[0].toUpperCase()}
      </div>

      {/* Name + level */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{entry.username}</span>
          {isMe && <span className="pill bg-brand-500/20 text-brand-300 text-xs">You</span>}
        </div>
        <div className="text-xs text-slate-500">Level {entry.level}</div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-right shrink-0">
        <div className="hidden sm:block">
          <div className="font-medium text-amber-400">{entry.accuracy}%</div>
          <div className="text-xs text-slate-500">accuracy</div>
        </div>
        <div className="hidden sm:block">
          <div className="font-medium text-slate-300">{entry.total_quizzes_taken}</div>
          <div className="text-xs text-slate-500">quizzes</div>
        </div>
        <div>
          <div className="font-bold text-brand-300">{entry.xp.toLocaleString()}</div>
          <div className="text-xs text-slate-500">XP</div>
        </div>
        {entry.current_streak > 0 && (
          <div className="text-amber-400 flex items-center gap-1 text-sm">
            🔥{entry.current_streak}
          </div>
        )}
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuthStore()
  const [sort, setSort] = useState('xp')

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', sort],
    queryFn:  () => authApi.leaderboard({ sort }).then((r) => r.data),
  })

  const entries: LeaderboardEntry[] = Array.isArray(data) ? data : data?.results ?? []
  const myRank = entries.findIndex((e) => e.username === user?.username) + 1

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
          <p className="text-slate-500 text-sm mt-1">Top learners worldwide</p>
        </div>
        {myRank > 0 && (
          <div className="text-right">
            <div className="text-sm text-slate-400">Your rank</div>
            <div className="text-2xl font-bold text-brand-300">#{myRank}</div>
          </div>
        )}
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2">
        {SORT_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            className={clsx('btn btn-sm', sort === s.value ? 'btn-primary' : 'btn-secondary')}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {!isLoading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 py-4">
          {[entries[1], entries[0], entries[2]].map((entry, podiumIdx) => {
            if (!entry) return null
            const actualRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3
            const heights   = ['h-20', 'h-28', 'h-16']
            return (
              <div key={entry.id} className="flex flex-col items-center gap-2">
                <span className="text-2xl">{RANK_MEDALS[actualRank - 1]}</span>
                <div className="w-14 h-14 rounded-full bg-brand-600/30 border-2 border-brand-500/50 flex items-center justify-center text-xl font-bold text-brand-300">
                  {entry.username[0].toUpperCase()}
                </div>
                <span className="text-xs font-medium text-center truncate w-full text-center">
                  {entry.username}
                </span>
                <div className={clsx(
                  'w-full rounded-t-lg flex items-end justify-center pb-2',
                  heights[podiumIdx],
                  actualRank === 1 ? 'bg-yellow-500/20 border border-yellow-500/30'
                  : actualRank === 2 ? 'bg-slate-400/10 border border-slate-500/30'
                  : 'bg-amber-700/10 border border-amber-700/30'
                )}>
                  <span className="text-xs font-bold">{entry.xp.toLocaleString()} XP</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {isLoading
          ? Array(10).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))
          : entries.map((entry, i) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                rank={i + 1}
                isMe={entry.username === user?.username}
              />
            ))
        }
      </div>
    </div>
  )
}
