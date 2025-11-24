// Admin Layout with TopNav
import { AdminTopNav } from '@/components/admin/AdminTopNav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // TEMPORARILY DISABLED: Auth check for debugging
  // Check if user is super_admin
  // const { data: profile } = await supabase
  //   .from('user_profiles')
  //   .select('role, email, full_name')
  //   .eq('user_id', user.id)
  //   .single()

  // if (!profile || profile.role !== 'super_admin') {
  //   redirect('/dashboard')
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopNav adminEmail={user.email || ''} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            © 2025 Katalara Platform. Super Admin Dashboard.
          </div>
        </div>
      </footer>
    </div>
  )
}
