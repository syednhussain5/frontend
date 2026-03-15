'use client'

import { useEffect, useCallback, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useQuizAttemptStore } from '@/store/quizStore'
import { quizApi, analyticsApi } from '@/lib/api'
import { Option } from '@/types'
import clsx from 'clsx'

// ── Timer display ─────────────────────────────────────────────────────────────
function TimerBadge({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const isUrgent = seconds <= 30
  return (
    <div className={clsx(
      'font-mono font-bold text-lg px-3 py-1 rounded-lg transition-colors',
      isUrgent ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-200'
    )}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  return (
    <div className="w-full progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Option button ─────────────────────────────────────────────────────────────
function OptionBtn({
  option, selected, showResult, isCorrect, isWrong, disabled, onClick,
}: {
  option: Option
  selected: boolean
  showResult: boolean
  isCorrect: boolean
  isWrong: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx('option-btn', {
        'selected':  selected && !showResult,
        'correct':   showResult && isCorrect,
        'incorrect': showResult && isWrong && selected,
        'disabled':  disabled && !showResult,
        'opacity-50 cursor-default': disabled && showResult && !isCorrect && !selected,
      })}
    >
      <span className="text-sm leading-relaxed">{option.text}</span>
      {showResult && isCorrect && <span className="float-right text-emerald-400">✓</span>}
      {showResult && isWrong && selected && <span className="float-right text-rose-400">✗</span>}
    </button>
  )
}

// ── Main quiz screen ──────────────────────────────────────────────────────────
export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const store = useQuizAttemptStore()
  const {
    attemptId, quiz, questions, currentIndex, totalQuestions,
    timeRemainingSeconds, showExplanation, lastAnswerResult,
    tabSwitches, isSubmitting, answers,
    currentQuestion, isAnswered, correctCount,
    nextQuestion, tickTimer, incrementTabSwitch,
    setSubmitting, reset, elapsedSeconds,
  } = store

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAnswering, setIsAnswering]  = useState(false)

  // Guard: if no attempt loaded, go back
  useEffect(() => {
    if (!attemptId || !quiz) {
      router.replace(`/quiz/${id}`)
    }
  }, [attemptId, quiz, id, router])

  // Timer tick
  useEffect(() => {
    if (timeRemainingSeconds === null) return
    if (timeRemainingSeconds <= 0) { handleAutoComplete(); return }
    const t = setInterval(tickTimer, 1000)
    return () => clearInterval(t)
  }, [timeRemainingSeconds])

  // Anti-cheat: tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        incrementTabSwitch()
        toast.error('⚠️ Tab switch detected!', { duration: 2000 })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [incrementTabSwitch])

  const q = currentQuestion()

  const handleSelect = (optionId: string) => {
    if (showExplanation || isAnswering) return
    const type = q?.question_type
    if (type === 'mcq' || type === 'true_false') {
      setSelectedIds([optionId])
    } else {
      // multi_select: toggle
      setSelectedIds((prev) =>
        prev.includes(optionId) ? prev.filter((x) => x !== optionId) : [...prev, optionId]
      )
    }
  }

  const handleSubmitAnswer = useCallback(async () => {
    if (!q || !attemptId || selectedIds.length === 0 || isAnswering) return
    setIsAnswering(true)

    const timeTaken = Math.round((Date.now() - store.questionStartTime) / 1000)
    try {
      const { data: result } = await quizApi.submitAnswer(attemptId, {
        question_id: q.id,
        selected_option_ids: selectedIds,
        time_taken_seconds: timeTaken,
      })
      store.recordAnswer(q.id, selectedIds, result)
    } catch {
      toast.error('Failed to submit answer')
    } finally {
      setIsAnswering(false)
    }
  }, [q, attemptId, selectedIds, isAnswering, store])

  const handleNext = () => {
    setSelectedIds([])
    nextQuestion()
  }

  const handleAutoComplete = useCallback(() => {
    handleFinish(true)
  }, [])

  const handleFinish = async (timedOut = false) => {
    if (!attemptId || isSubmitting) return
    setSubmitting(true)

    try {
      const elapsed = elapsedSeconds()
      const { data } = await quizApi.completeAttempt(attemptId, {
        time_taken_seconds: elapsed,
        tab_switches: tabSwitches,
      })

      // Update analytics in background
      analyticsApi.update(data.attempt_id).catch(() => {})

      reset()
      router.push(`/quiz/${id}/results?attempt=${data.attempt_id}`)
    } catch {
      toast.error('Failed to complete quiz')
      setSubmitting(false)
    }
  }

  if (!q || !quiz) return null

  const isLastQuestion   = currentIndex >= totalQuestions - 1
  const answeredCount    = Object.keys(answers).length
  const progressPercent  = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" onContextMenu={(e) => e.preventDefault()}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Question {currentIndex + 1} / {totalQuestions}</span>
              <span>{correctCount()} correct</span>
            </div>
            <ProgressBar current={answeredCount} total={totalQuestions} />
          </div>

          {timeRemainingSeconds !== null && (
            <TimerBadge seconds={timeRemainingSeconds} />
          )}

          {tabSwitches > 0 && (
            <div className="text-xs text-rose-400 flex items-center gap-1">
              ⚠️ {tabSwitches}
            </div>
          )}
        </div>
      </div>

      {/* Question body */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Difficulty badge */}
        <div className="flex items-center gap-2">
          <span className={clsx('pill', {
            'pill-easy':   q.difficulty === 'easy',
            'pill-medium': q.difficulty === 'medium',
            'pill-hard':   q.difficulty === 'hard',
          })}>
            {q.difficulty}
          </span>
          {q.topic_tag && (
            <span className="text-xs text-slate-500">{q.topic_tag}</span>
          )}
        </div>

        {/* Question text */}
        <div className="animate-slide-up">
          <h2 className="text-xl font-semibold leading-relaxed text-slate-100">
            {q.text}
          </h2>
          {q.image_url && (
            <img
              src={q.image_url}
              alt="Question image"
              className="mt-4 rounded-xl max-h-56 object-cover border border-slate-700"
            />
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 animate-fade-in">
          {q.options.map((opt) => {
            const isSelected = selectedIds.includes(opt.id)
            const correctIds = lastAnswerResult?.correct_option_ids ?? []
            const isCorrect  = correctIds.includes(opt.id)
            const isWrong    = isSelected && !isCorrect

            return (
              <OptionBtn
                key={opt.id}
                option={opt}
                selected={isSelected}
                showResult={showExplanation}
                isCorrect={showExplanation && isCorrect}
                isWrong={showExplanation && isWrong}
                disabled={showExplanation || isAnswering}
                onClick={() => handleSelect(opt.id)}
              />
            )
          })}
        </div>

        {/* Explanation panel */}
        {showExplanation && lastAnswerResult && (
          <div className={clsx(
            'card p-5 animate-slide-up border',
            lastAnswerResult.is_correct
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-rose-500/40 bg-rose-500/5'
          )}>
            <div className="flex items-center gap-2 mb-2 font-semibold">
              {lastAnswerResult.is_correct
                ? <><span className="text-emerald-400 text-lg">✓</span><span className="text-emerald-400">Correct!</span></>
                : <><span className="text-rose-400 text-lg">✗</span><span className="text-rose-400">Incorrect</span></>
              }
            </div>
            {lastAnswerResult.explanation && (
              <p className="text-sm text-slate-300 leading-relaxed">{lastAnswerResult.explanation}</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-2">
          {!showExplanation ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedIds.length === 0 || isAnswering}
              className="btn-primary btn btn-lg flex-1 justify-center"
            >
              {isAnswering ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Checking…
                </span>
              ) : 'Submit Answer'}
            </button>
          ) : (
            <>
              {!isLastQuestion ? (
                <button onClick={handleNext} className="btn-primary btn btn-lg flex-1 justify-center">
                  Next Question →
                </button>
              ) : (
                <button
                  onClick={() => handleFinish()}
                  disabled={isSubmitting}
                  className="btn-primary btn btn-lg flex-1 justify-center"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving results…
                    </span>
                  ) : '🏁 Finish Quiz'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Skip / abandon (last resort) */}
        {!showExplanation && (
          <button
            onClick={handleNext}
            className="btn-ghost btn btn-sm text-xs self-center text-slate-600"
          >
            Skip question
          </button>
        )}
      </div>
    </div>
  )
}
