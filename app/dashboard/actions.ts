'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTelegramChatId(chatId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ telegram_chat_id: chatId })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating Telegram Chat ID:', error)
    throw new Error('Failed to update Telegram Chat ID')
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
