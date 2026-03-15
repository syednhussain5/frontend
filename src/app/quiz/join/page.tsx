'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { quizApi } from '@/lib/api'

export default function JoinRoomPage() {
  const router = useRouter()
  const [code, setCode] = useState('')

  const joinMutation = useMutation({
    mutationFn: () => quizApi.joinRoom(code.toUpperCase()),
    onSuccess: ({ data }) => {
      toast.success(`Joined room ${data.code}!`)
      router.push(`/quiz/room/${data.id}`)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Room not found')
    },
  })

  return (
    <div className="p-6 max-w-md mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">⚔️ Join Quiz Battle</h1>
        <p className="text-slate-400 text-sm mt-2">Enter a room code to join a live multiplayer quiz</p>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="label">Room Code</label>
          <input
            className="input text-center text-2xl font-mono tracking-widest uppercase"
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            maxLength={6}
            autoFocus
          />
        </div>
        <button
          onClick={() => joinMutation.mutate()}
          disabled={code.length < 4 || joinMutation.isPending}
          className="btn-primary btn btn-lg w-full justify-center"
        >
          {joinMutation.isPending ? 'Joining…' : 'Join Room →'}
        </button>
      </div>

      <div className="text-center text-slate-500 text-sm">
        Want to host?{' '}
        <button
          onClick={() => router.push('/quiz')}
          className="text-brand-400 hover:underline"
        >
          Browse quizzes to create a room
        </button>
      </div>
    </div>
  )
}
