'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { quizApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { QuizAttempt, Answer } from '@/types'
import clsx from 'clsx'

// Lazy-load confetti to avoid SSR issues
const Confetti = dynamic(() => import('react-confetti'), { ssr: false })

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference)
    }, 300)
    return () => clearTimeout(t)
  }, [score, circumference])

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-xs text-slate-500">score</span>
      </div>
    </div>
  )
}

function AnswerRow({ answer, index }: { answer: Answer; index: number }) {
  const [open, setOpen] = useState(false)
  const correctOption = answer.correct_options?.find((o) => o.is_correct)
  const selectedIds   = answer.selected_option_ids ?? []

  return (
    <div className={clsx('card border p-4 transition-all', {
      'border-emerald-500/30': answer.is_correct,
      'border-rose-500/30':    !answer.is_correct,
    })}>
      <button
        className="w-full text-left flex items-start gap-3"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={clsx('mt-0.5 text-lg shrink-0', {
          'text-emerald-400': answer.is_correct,
          'text-rose-400':    !answer.is_correct,
        })}>
          {answer.is_correct ? '✓' : '✗'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 leading-snug">
            <span className="text-slate-500 mr-2">Q{index + 1}.</span>
            {answer.question_text}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>⏱ {answer.time_taken_seconds}s</span>
            <span className={clsx('pill text-xs', {
              'pill-easy':   answer.shown_difficulty === 'easy',
              'pill-medium': answer.shown_difficulty === 'medium',
              'pill-hard':   answer.shown_difficulty === 'hard',
            })}>{answer.shown_difficulty}</span>
          </div>
        </div>
        <span className="text-slate-600 text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 animate-slide-up">
          {answer.correct_options?.map((opt) => (
            <div
              key={opt.id}
              className={clsx('text-sm px-3 py-2 rounded-lg', {
                'bg-emerald-500/15 text-emerald-300': opt.is_correct,
                'bg-rose-500/15 text-rose-300':
                  !opt.is_correct && selectedIds.includes(String(opt.id)),
                'text-slate-400': !opt.is_correct && !selectedIds.includes(String(opt.id)),
              })}
            >
              {opt.is_correct && '✓ '}
              {!opt.is_correct && selectedIds.includes(String(opt.id)) && '✗ '}
              {opt.text}
            </div>
          ))}
          {answer.question_explanation && (
            <div className="bg-slate-800/60 rounded-lg p-3 mt-2">
              <p className="text-xs text-slate-400 font-medium mb-1">💡 Explanation</p>
              <p className="text-sm text-slate-300">{answer.question_explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  const { id }         = useParams<{ id: string }>()
  const searchParams   = useSearchParams()
  const attemptId      = searchParams.get('attempt')
  const router         = useRouter()
  const { addXP }      = useAuthStore()
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize]     = useState({ width: 0, height: 0 })
  const rewardProcessed = useRef(false)

  const { data: attempt, isLoading } = useQuery<QuizAttempt>({
    queryKey: ['attempt', attemptId],
    queryFn:  () => quizApi.getAttempt(attemptId!).then((r) => r.data),
    enabled:  !!attemptId,
  })

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
  }, [])

  useEffect(() => {
    if (!attempt || rewardProcessed.current) return
    rewardProcessed.current = true
    if (attempt.score >= 60) setShowConfetti(true)
    if (attempt.xp_earned > 0) addXP(attempt.xp_earned)
    const t = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(t)
  }, [attempt, addXP])

  if (isLoading || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading results…</p>
        </div>
      </div>
    )
  }

  const { score, correct_count, total_questions, time_taken_seconds, tab_switches, xp_earned } = attempt

  const grade =
    score >= 90 ? { label: 'Outstanding! 🏆', color: 'text-yellow-400' }
    : score >= 80 ? { label: 'Excellent! 🌟',  color: 'text-emerald-400' }
    : score >= 60 ? { label: 'Good Job! 👍',   color: 'text-blue-400'   }
    : score >= 40 ? { label: 'Keep Going 💪',  color: 'text-amber-400'  }
    : { label: 'Need Practice 📚',             color: 'text-rose-400'   }

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      {showConfetti && (
        <div className="confetti-overlay">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={350}
            colors={['#6271f1', '#818cf8', '#f97316', '#22c55e', '#f59e0b']}
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8 animate-slide-up">
        {/* Header */}
        <div className="text-center">
          <h1 className={clsx('text-3xl font-bold mb-1', grade.color)}>{grade.label}</h1>
          <p className="text-slate-500 text-sm">{attempt.quiz_title}</p>
        </div>

        {/* Score ring + stats */}
        <div className="card p-8">
          <ScoreRing score={score} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {[
              ['✓', `${correct_count}/${total_questions}`, 'Correct'],
              ['⏱', time_taken_seconds ? `${Math.floor(time_taken_seconds / 60)}m ${time_taken_seconds % 60}s` : '—', 'Time'],
              ['⚡', `+${xp_earned}`, 'XP Earned'],
              ['👁', tab_switches ?? 0, 'Tab Switches'],
            ].map(([icon, val, label]) => (
              <div key={label as string} className="text-center">
                <div className="text-lg mb-0.5">{icon}</div>
                <div className="font-bold text-slate-100">{val}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          {(tab_switches ?? 0) > 2 && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-300 text-center">
              ⚠️ High tab switches detected — results may be flagged
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/quiz/${id}`} className="btn-primary btn btn-md justify-center">
            🔄 Retake Quiz
          </Link>
          <Link href="/quiz/revision" className="btn-secondary btn btn-md justify-center">
            🔁 Smart Revision
          </Link>
          <Link href="/quiz/create" className="btn-secondary btn btn-md justify-center">
            ✨ New Quiz
          </Link>
          <Link href="/leaderboard" className="btn-secondary btn btn-md justify-center">
            🏆 Leaderboard
          </Link>
        </div>

        {/* Answer review */}
        {attempt.answers && attempt.answers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">📋 Answer Review</h2>
            <div className="space-y-3">
              {attempt.answers.map((a, i) => (
                <AnswerRow key={a.id} answer={a} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
