'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { quizApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useQuizAttemptStore } from '@/store/quizStore'
import { Quiz } from '@/types'

export default function QuizDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const { user }  = useAuthStore()
  const initAttempt = useQuizAttemptStore((s) => s.initAttempt)

  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: ['quiz', id],
    queryFn:  () => quizApi.get(id).then((r) => r.data),
  })

  const startMutation = useMutation({
    mutationFn: () => quizApi.startAttempt(id),
    onSuccess: ({ data }) => {
      if (!quiz?.questions) return
      initAttempt(data.attempt_id, { ...quiz, time_limit_minutes: data.time_limit_minutes }, data.quiz.questions)
      router.push(`/quiz/${id}/take`)
    },
    onError: () => toast.error('Failed to start quiz'),
  })

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!quiz) return <div className="p-6 text-slate-400">Quiz not found.</div>

  const diffClass: Record<string, string> = {
    easy: 'pill-easy', medium: 'pill-medium', hard: 'pill-hard', adaptive: 'pill-adaptive',
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className={diffClass[quiz.difficulty]}>{quiz.difficulty}</span>
          {quiz.is_ai_generated && <span className="pill bg-violet-500/10 text-violet-400">🤖 AI</span>}
          <span className={`pill ${quiz.status === 'ready' ? 'pill-ready' : quiz.status === 'generating' ? 'pill-generating' : 'pill-failed'}`}>
            {quiz.status}
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
        {quiz.description && <p className="text-slate-400">{quiz.description}</p>}
        <p className="text-sm text-slate-500 mt-2">by {quiz.creator_username}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['❓', quiz.questions?.length ?? quiz.question_count, 'Questions'],
          ['⏱', quiz.time_limit_minutes ? `${quiz.time_limit_minutes}m` : '∞', 'Time Limit'],
          ['▶', quiz.play_count, 'Attempts'],
          ['★', quiz.average_score ? `${quiz.average_score.toFixed(0)}%` : '—', 'Avg Score'],
        ].map(([icon, val, label]) => (
          <div key={label as string} className="card p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="font-bold text-lg">{val}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Topics/tags */}
      {quiz.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quiz.tags.map((tag) => (
            <span key={tag} className="text-sm bg-slate-800 text-slate-400 px-3 py-1 rounded-full">{tag}</span>
          ))}
        </div>
      )}

      {/* Settings info */}
      <div className="card p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        {[
          ['🔀', 'Randomized questions', quiz.randomize_questions],
          ['📋', 'Show answers after',   quiz.allow_review],
          ['🌐', 'Public quiz',          quiz.is_public],
        ].map(([icon, label, val]) => (
          <div key={label as string} className="flex items-center gap-2">
            <span>{icon}</span>
            <span className="text-slate-400">{label}</span>
            <span className={val ? 'text-green-400' : 'text-slate-600'}>{val ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>

      {/* Generating state */}
      {quiz.status === 'generating' && (
        <div className="card p-6 text-center">
          <div className="text-3xl mb-3 animate-float">🤖</div>
          <p className="font-medium mb-1">AI is generating questions…</p>
          <p className="text-sm text-slate-400">Refresh in a few seconds</p>
        </div>
      )}

      {/* Actions */}
      {quiz.status === 'ready' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="btn-primary btn btn-lg flex-1 justify-center"
          >
            {startMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting…
              </span>
            ) : '▶ Start Quiz'}
          </button>

          {user?.username === quiz.creator_username && (
            <Link href={`/quiz/${quiz.id}/edit`} className="btn-secondary btn btn-lg">
              ✏️ Edit
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
