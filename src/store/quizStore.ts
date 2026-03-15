import { create } from 'zustand'
import { Quiz, Question, AnswerResult } from '@/types'

interface AnswerRecord {
  questionId: string
  selectedOptionIds: string[]
  isCorrect: boolean
  timeTaken: number
  result: AnswerResult
}

interface QuizAttemptState {
  // Attempt metadata
  attemptId: string | null
  quiz: Quiz | null
  questions: Question[]
  currentIndex: number
  totalQuestions: number

  // Per-question tracking
  answers: Record<string, AnswerRecord>
  questionStartTime: number   // timestamp when current question appeared

  // Timer
  quizStartTime: number | null
  timeRemainingSeconds: number | null

  // Anti-cheat
  tabSwitches: number

  // UI state
  showExplanation: boolean
  lastAnswerResult: AnswerResult | null
  isSubmitting: boolean

  // Actions
  initAttempt: (attemptId: string, quiz: Quiz, questions: Question[]) => void
  recordAnswer: (questionId: string, selectedOptionIds: string[], result: AnswerResult) => void
  nextQuestion: () => void
  tickTimer: () => void
  incrementTabSwitch: () => void
  setShowExplanation: (v: boolean) => void
  setSubmitting: (v: boolean) => void
  reset: () => void

  // Derived
  currentQuestion: () => Question | null
  isAnswered: (questionId: string) => boolean
  correctCount: () => number
  elapsedSeconds: () => number
}

const initialState = {
  attemptId: null,
  quiz: null,
  questions: [],
  currentIndex: 0,
  totalQuestions: 0,
  answers: {},
  questionStartTime: Date.now(),
  quizStartTime: null,
  timeRemainingSeconds: null,
  tabSwitches: 0,
  showExplanation: false,
  lastAnswerResult: null,
  isSubmitting: false,
}

export const useQuizAttemptStore = create<QuizAttemptState>((set, get) => ({
  ...initialState,

  initAttempt: (attemptId, quiz, questions) => {
    const timeRemainingSeconds = quiz.time_limit_minutes
      ? quiz.time_limit_minutes * 60
      : null
    set({
      attemptId,
      quiz,
      questions,
      totalQuestions: questions.length,
      currentIndex: 0,
      answers: {},
      questionStartTime: Date.now(),
      quizStartTime: Date.now(),
      timeRemainingSeconds,
      tabSwitches: 0,
      showExplanation: false,
      lastAnswerResult: null,
    })
  },

  recordAnswer: (questionId, selectedOptionIds, result) => {
    const timeTaken = Math.round((Date.now() - get().questionStartTime) / 1000)
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: { questionId, selectedOptionIds, isCorrect: result.is_correct, timeTaken, result },
      },
      lastAnswerResult: result,
      showExplanation: true,
    }))
  },

  nextQuestion: () => {
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      questionStartTime: Date.now(),
      showExplanation: false,
      lastAnswerResult: null,
    }))
  },

  tickTimer: () => {
    set((state) => {
      if (state.timeRemainingSeconds === null || state.timeRemainingSeconds <= 0) return state
      return { timeRemainingSeconds: state.timeRemainingSeconds - 1 }
    })
  },

  incrementTabSwitch: () =>
    set((state) => ({ tabSwitches: state.tabSwitches + 1 })),

  setShowExplanation: (v) => set({ showExplanation: v }),
  setSubmitting: (v) => set({ isSubmitting: v }),

  reset: () => set(initialState),

  currentQuestion: () => {
    const { questions, currentIndex } = get()
    return questions[currentIndex] ?? null
  },

  isAnswered: (questionId) => !!get().answers[questionId],

  correctCount: () =>
    Object.values(get().answers).filter((a) => a.isCorrect).length,

  elapsedSeconds: () => {
    const { quizStartTime } = get()
    if (!quizStartTime) return 0
    return Math.round((Date.now() - quizStartTime) / 1000)
  },
}))
