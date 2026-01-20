'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type NotificationRow = {
  id: string
  type: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical' | 'success' | string
  action_url?: string | null
  is_read: boolean
  created_at: string
}

function severityStyles(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 border-red-200 text-red-900'
    case 'warning':
      return 'bg-amber-50 border-amber-200 text-amber-900'
    case 'success':
      return 'bg-emerald-50 border-emerald-200 text-emerald-900'
    default:
      return 'bg-blue-50 border-blue-200 text-blue-900'
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const grouped = useMemo(() => {
    const unread = items.filter((i) => !i.is_read)
    const read = items.filter((i) => i.is_read)
    return { unread, read }
  }, [items])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications?limit=100', { cache: 'no-store' })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed')
      setItems(json.data || [])
      setUnreadCount(Number(json.unreadCount || 0))
    } catch (e) {
      console.error('Failed to load notifications:', e)
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    await load()
  }

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600">{unreadCount} belum dibaca</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load()}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => markAllRead()}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Tandai semua dibaca
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          Belum ada notifikasi.
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.unread.length > 0 && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Belum dibaca</div>
          )}
          {grouped.unread.map((n) => (
            <div
              key={n.id}
              className={`border rounded-lg p-4 ${severityStyles(n.severity)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{n.title}</div>
                  <div className="text-sm mt-1 text-gray-700 break-words">{n.message}</div>
                  <div className="text-xs mt-2 text-gray-500">{new Date(n.created_at).toLocaleString('id-ID')}</div>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  {n.action_url && (
                    <button
                      onClick={() => router.push(n.action_url as string)}
                      className="px-3 py-2 text-sm font-medium rounded-lg bg-white/60 border border-gray-200 hover:bg-white"
                    >
                      Buka
                    </button>
                  )}
                  <button
                    onClick={() => markRead(n.id)}
                    className="px-3 py-2 text-sm font-medium rounded-lg bg-white/60 border border-gray-200 hover:bg-white"
                  >
                    Tandai dibaca
                  </button>
                </div>
              </div>
            </div>
          ))}

          {grouped.read.length > 0 && (
            <div className="pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sudah dibaca</div>
          )}
          {grouped.read.map((n) => (
            <div
              key={n.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{n.title}</div>
                  <div className="text-sm mt-1 text-gray-700 break-words">{n.message}</div>
                  <div className="text-xs mt-2 text-gray-500">{new Date(n.created_at).toLocaleString('id-ID')}</div>
                </div>
                {n.action_url && (
                  <button
                    onClick={() => router.push(n.action_url as string)}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Buka
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
