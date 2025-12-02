import { createClient } from '@supabase/supabase-js'

// Ganti dengan URL dan KEY Supabase Anda
const SUPABASE_URL = 'https://usradkbchlkcfoabxvbo.supabase.co' // URL project yang benar
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcmFka2JjaGxrY2ZvYWJ4dmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMTA2ODUsImV4cCI6MjA0ODc4NjY4NX0.iyiL5BL7zHNS_S8Xo8Qv-2_tI-fMPkZHGJ9PdmzZdCc' // Anon key project yang benar

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function updateRangerRoles() {
  console.log('🔄 Updating user roles for existing Rangers...\n')

  try {
    // Get all ranger profiles
    const { data: rangers, error: fetchError } = await supabase
      .from('ranger_profiles')
      .select('user_id, full_name')

    if (fetchError) {
      console.error('❌ Error fetching rangers:', fetchError)
      return
    }

    console.log(`📋 Found ${rangers.length} ranger(s)\n`)

    for (const ranger of rangers) {
      // Update user_profiles role to 'ranger'
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'ranger' })
        .eq('user_id', ranger.user_id)

      if (updateError) {
        console.error(`❌ Failed to update role for ${ranger.full_name}:`, updateError.message)
      } else {
        console.log(`✅ Updated role for ${ranger.full_name}`)
      }
    }

    console.log('\n✨ Done! All Rangers should now have correct role.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

updateRangerRoles()
