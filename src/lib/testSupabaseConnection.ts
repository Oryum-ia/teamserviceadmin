import { supabase } from './supabaseClient'

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Supabase connection error:', error.message)
      return { success: false, error: error.message }
    }

    console.log('✅ Supabase connection successful!')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return { success: false, error: String(error) }
  }
}
