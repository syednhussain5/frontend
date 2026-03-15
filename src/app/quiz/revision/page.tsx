'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { quizApi } from '@/lib/api'
import { useQuizAttemptStore } from '@/store/quizStore'

export default function RevisionPage() {
  const router = useRouter()
  const initAttempt = useQuizAttemptStore((s) => s.initAttempt)
  const [generated, setGenerated] = useState<any>(null)

  const mutation = useMutation({
    mutationFn: () => quizApi.createRevision(),
    onSuccess: ({ data }) => {
      setGenerated(data)
      toast.success('Revision quiz ready!')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'No wrong answers to revise yet!')
    },
  })

  const startRevision = async () => {
    if (!generated) return
    try {
      const { data } = await quizApi.startAttempt(generated.id)
      initAttempt(data.attempt_id, { ...generated, time_limit_minutes: null }, data.quiz.questions)
      router.push(`/quiz/${generated.id}/take`)
    } catch {
      toast.error('Failed to start revision quiz')
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">🔁 Smart Revision</h1>
        <p className="text-slate-400 text-sm mt-2">
          AI analyses your past wrong answers and generates targeted practice questions to close your knowledge gaps.
        </p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-4">
          <span className="text-4xl">🧠</span>
          <div>
            <h2 className="font-semibold mb-1">How it works</h2>
            <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
              <li>We look at your last 20 wrong answers</li>
              <li>AI generates new questions on the same concepts</li>
              <li>Questions are easier — focused on understanding</li>
              <li>Repeat until you've mastered the weak areas</li>
            </ul>
          </div>
        </div>

        {!generated ? (
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="btn-primary btn btn-lg w-full justify-center"
          >
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating revision quiz…
              </span>
            ) : '🤖 Generate My Revision Quiz'}
          </button>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <div className="bg-brand-600/10 border border-brand-500/30 rounded-xl p-4">
              <p className="font-medium text-brand-300 mb-1">✅ Revision quiz ready!</p>
              <p className="text-sm text-slate-400">{generated.title}</p>
              <p className="text-sm text-slate-500 mt-1">{generated.question_count} questions · Easy difficulty</p>
            </div>
            <button onClick={startRevision} className="btn-primary btn btn-lg w-full justify-center">
              ▶ Start Revision Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
