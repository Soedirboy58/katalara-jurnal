'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestMiddlewarePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testMiddlewareLogic() {
      const supabase = createClient()
      
      // Step 1: Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setResult({
          step: 'auth.getUser()',
          success: false,
          error: userError?.message || 'No user found',
          user: null
        })
        setLoading(false)
        return
      }

      // Step 2: Query profile with exact middleware logic
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      setResult({
        step: 'Query user_profiles',
        success: !profileError,
        user: {
          id: user.id,
          email: user.email
        },
        query: {
          table: 'user_profiles',
          filter: `user_id = ${user.id}`,
          result: profile,
          error: profileError?.message
        },
        profile: profile,
        roleCheck: {
          role: profile?.role,
          isSuper: profile?.role === 'super_admin',
          shouldAllowAdmin: profile?.role === 'super_admin'
        }
      })
      
      setLoading(false)
    }

    testMiddlewareLogic()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Testing middleware logic...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Middleware Logic Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Test Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>

        {result?.roleCheck && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis</h2>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Query Successful: {result.success ? 'YES' : 'NO'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${result.profile?.role ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Role Found: {result.profile?.role || 'NONE'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${result.roleCheck.isSuper ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Is Super Admin: {result.roleCheck.isSuper ? 'YES' : 'NO'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${result.roleCheck.shouldAllowAdmin ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Should Allow /admin: {result.roleCheck.shouldAllowAdmin ? 'YES' : 'NO'}</span>
              </div>
            </div>

            {result.roleCheck.shouldAllowAdmin ? (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 font-semibold">✅ Middleware logic should allow admin access</p>
                <p className="text-sm text-green-700 mt-2">
                  If you're still being redirected, the issue might be:
                  <ul className="list-disc ml-5 mt-2">
                    <li>Browser cache (try incognito/private window)</li>
                    <li>Cookie/session issue (try logout and login again)</li>
                    <li>Middleware not being triggered (check next.config.ts)</li>
                  </ul>
                </p>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 font-semibold">❌ Middleware logic would block admin access</p>
                <p className="text-sm text-red-700 mt-2">
                  Issue: Role is "{result.profile?.role}" instead of "super_admin"
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <a 
            href="/admin/dashboard" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Admin Dashboard
          </a>
          <a 
            href="/dashboard" 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go to User Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
