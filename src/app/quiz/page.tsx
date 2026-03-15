'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { quizApi } from '@/lib/api'
import { Quiz } from '@/types'

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard', 'adaptive']

function QuizCard({ quiz }: { quiz: Quiz }) {
  const diffClass: Record<string, string> = {
    easy: 'pill-easy', medium: 'pill-medium', hard: 'pill-hard', adaptive: 'pill-adaptive',
  }
  return (
    <Link href={`/quiz/${quiz.id}`} className="card card-hover p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-100 leading-snug">{quiz.title}</h3>
        <span className={diffClass[quiz.difficulty] ?? 'pill'}>{quiz.difficulty}</span>
      </div>
      <p className="text-sm text-slate-400 line-clamp-2">{quiz.topic}</p>
      <div className="flex items-center gap-3 text-xs text-slate-500 mt-auto">
        <span>❓ {quiz.question_count} questions</span>
        {quiz.time_limit_minutes && <span>⏱ {quiz.time_limit_minutes}m</span>}
        <span>▶ {quiz.play_count} plays</span>
        {quiz.average_score > 0 && (
          <span className="text-amber-400">★ {quiz.average_score.toFixed(0)}%</span>
        )}
      </div>
      {quiz.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {quiz.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <span>by {quiz.creator_username}</span>
        {quiz.is_ai_generated && <span className="pill bg-violet-500/10 text-violet-400">AI</span>}
      </div>
    </Link>
  )
}

function QuizCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  )
}

export default function QuizListPage() {
  const [search, setSearch]         = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [myOnly, setMyOnly]         = useState(false)

  const params: Record<string, string> = {}
  if (search)     params.q = search
  if (difficulty !== 'all') params.difficulty = difficulty
  if (myOnly)     params.my = 'true'

  const { data, isLoading } = useQuery({
    queryKey: ['quizzes', params],
    queryFn:  () => quizApi.list(params).then((r) => r.data),
  })

  const quizzes: Quiz[] = data?.results ?? data ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <p className="text-slate-500 text-sm mt-1">Browse, take, and track AI-generated quizzes</p>
        </div>
        <Link href="/quiz/create" className="btn-primary btn btn-md">✨ Create quiz</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input flex-1"
          placeholder="Search quizzes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`btn btn-sm capitalize ${difficulty === d ? 'btn-primary' : 'btn-secondary'}`}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          onClick={() => setMyOnly((v) => !v)}
          className={`btn btn-sm ${myOnly ? 'btn-primary' : 'btn-secondary'}`}
        >
          My quizzes
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array(9).fill(0).map((_, i) => <QuizCardSkeleton key={i} />)
          : quizzes.length
          ? quizzes.map((q) => <QuizCard key={q.id} quiz={q} />)
          : (
            <div className="col-span-3 text-center py-16 text-slate-500">
              <div className="text-5xl mb-4">📭</div>
              <p className="font-medium mb-2">No quizzes found</p>
              <p className="text-sm mb-6">Try adjusting filters or create a new quiz</p>
              <Link href="/quiz/create" className="btn-primary btn btn-md">✨ Create AI quiz</Link>
            </div>
          )}
      </div>
    </div>
  )
}
