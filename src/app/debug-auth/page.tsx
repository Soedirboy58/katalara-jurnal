'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setAuthInfo({ error: 'Not logged in' })
      setLoading(false)
      return
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setAuthInfo({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      profileError: error
    })
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 Auth Debug Info</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <pre className="text-sm overflow-auto">
          {JSON.stringify(authInfo, null, 2)}
        </pre>
      </div>

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">✅ Expected for Admin Access:</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>User is logged in</li>
            <li>Profile.role = "super_admin"</li>
            <li>Email = delta.sc58@gmail.com</li>
          </ul>
        </div>

        {authInfo?.profile?.role === 'super_admin' && (
          <div className="p-4 bg-green-50 text-green-800 rounded">
            ✅ You have admin access! Go to <a href="/admin/dashboard" className="underline font-semibold">/admin/dashboard</a>
          </div>
        )}

        {authInfo?.profile?.role !== 'super_admin' && authInfo?.profile && (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded">
            ⚠️ Your role is "{authInfo.profile.role}" - need "super_admin" for admin access
          </div>
        )}
      </div>
    </div>
  )
}
