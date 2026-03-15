'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { quizApi } from '@/lib/api'

const TOPICS = [
  'JavaScript', 'Python', 'Machine Learning', 'World History', 'Biology',
  'Mathematics', 'Physics', 'Chemistry', 'Geography', 'Literature',
  'Computer Science', 'Economics', 'Psychology', 'Philosophy', 'Music Theory',
]

const DIFFICULTIES = [
  { value: 'easy',     label: 'Easy',     desc: 'Beginner-friendly questions' },
  { value: 'medium',   label: 'Medium',   desc: 'Balanced challenge'          },
  { value: 'hard',     label: 'Hard',     desc: 'Expert-level questions'      },
  { value: 'adaptive', label: 'Adaptive', desc: 'Adjusts to your skill'       },
]

export default function CreateQuizPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    topic:             '',
    question_count:    10,
    difficulty:        'medium',
    time_limit_minutes: '' as number | '',
    is_public:         true,
    allow_review:      true,
    randomize_questions: true,
    source_material:   '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const pollRef = useRef<NodeJS.Timeout>()

  // Poll for quiz readiness
  useEffect(() => {
    if (!generatingId) return
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await quizApi.status(generatingId)
        setPollCount((c) => c + 1)
        if (data.status === 'ready') {
          clearInterval(pollRef.current)
          toast.success('Quiz generated! Let\'s go 🚀')
          router.push(`/quiz/${generatingId}`)
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current)
          setGeneratingId(null)
          setIsCreating(false)
          toast.error('AI generation failed. Please try again.')
        }
      } catch {
        clearInterval(pollRef.current)
        setIsCreating(false)
      }
    }, 2500)

    return () => clearInterval(pollRef.current)
  }, [generatingId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.topic.trim()) { toast.error('Enter a topic'); return }
    setIsCreating(true)

    const payload = {
      ...form,
      title: `${form.topic} Quiz`,
      time_limit_minutes: form.time_limit_minutes || null,
    }

    try {
      const { data } = await quizApi.create(payload)
      setGeneratingId(data.id)
    } catch (err: any) {
      setIsCreating(false)
      toast.error(err?.response?.data?.detail || 'Failed to create quiz')
    }
  }

  if (isCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm animate-scale-in">
          <div className="text-6xl mb-6 animate-float">🤖</div>
          <h2 className="text-2xl font-bold mb-3">AI is crafting your quiz…</h2>
          <p className="text-slate-400 text-sm mb-6">
            Generating {form.question_count} questions on{' '}
            <span className="text-brand-300 font-medium">{form.topic}</span>
          </p>
          <div className="w-48 mx-auto">
            <div className="xp-bar mb-2">
              <div
                className="xp-bar-fill transition-all duration-1000"
                style={{ width: `${Math.min(pollCount * 15, 90)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{
              pollCount < 3 ? 'Researching topic…'
              : pollCount < 6 ? 'Writing questions…'
              : 'Finalising answers…'
            }</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">✨ Create AI Quiz</h1>
        <p className="text-slate-400 text-sm mt-1">Gemini AI will generate unique questions for you</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic */}
        <div>
          <label className="label">Topic *</label>
          <input
            className="input"
            placeholder="e.g. World War II, Python decorators, Photosynthesis…"
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            required
            autoFocus
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, topic: t }))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  form.topic === t
                    ? 'border-brand-500 bg-brand-600/20 text-brand-300'
                    : 'border-slate-700 text-slate-500 hover:border-slate-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Question count */}
        <div>
          <label className="label">Number of questions: <span className="text-brand-300">{form.question_count}</span></label>
          <input
            type="range" min={5} max={20} step={1}
            value={form.question_count}
            onChange={(e) => setForm((f) => ({ ...f, question_count: +e.target.value }))}
            className="w-full accent-brand-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>5</span><span>10</span><span>15</span><span>20</span>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="label">Difficulty</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, difficulty: d.value }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  form.difficulty === d.value
                    ? 'border-brand-500 bg-brand-600/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="font-medium text-sm">{d.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time limit */}
        <div>
          <label className="label">Time limit (optional)</label>
          <select
            className="input"
            value={form.time_limit_minutes}
            onChange={(e) => setForm((f) => ({ ...f, time_limit_minutes: e.target.value ? +e.target.value : '' }))}
          >
            <option value="">No time limit</option>
            {[5, 10, 15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </select>
        </div>

        {/* Source material */}
        <div>
          <label className="label">Source material (optional)</label>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="Paste notes, a chapter, or any text to generate questions from your own content…"
            value={form.source_material}
            onChange={(e) => setForm((f) => ({ ...f, source_material: e.target.value }))}
          />
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            ['is_public',           'Public quiz',           'Others can find and take it'],
            ['allow_review',        'Show answers',          'Reveal explanations after'],
            ['randomize_questions', 'Shuffle questions',     'Different order each time'],
          ] as const).map(([key, label, desc]) => (
            <label key={key} className="card p-4 cursor-pointer flex items-center gap-3">
              <input
                type="checkbox"
                checked={form[key] as boolean}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                className="accent-brand-500 w-4 h-4"
              />
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
            </label>
          ))}
        </div>

        <button type="submit" className="btn-primary btn btn-lg w-full">
          🤖 Generate quiz with AI
        </button>
      </form>
    </div>
  )
}
