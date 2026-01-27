import { createClient } from '@supabase/supabase-js'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const update = await req.json()
    console.log('Received update:', JSON.stringify(update))

    if (update.message?.text) {
      const chatId = update.message.chat.id
      const text = update.message.text

      if (text === '/start') {
        const message = `Welcome to MediLog Bot! 🏥\n\nYour Chat ID is: \`${chatId}\`\n\nPlease add this ID to your profile in the MediLog app to link your account.`
        await sendMessage(chatId, message)
      } else if (text === '/status') {
        await handleStatus(chatId)
      } else {
        await sendMessage(chatId, "I didn't understand that command. Try /status")
      }
    }

    return new Response('OK', { headers: { 'Content-Type': 'text/plain' } })
  } catch (error) {
    console.error('Error handling request:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})

async function handleStatus(chatId: number) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Find user by Telegram Chat ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('telegram_chat_id', chatId.toString())
    .single()

  if (!profile) {
    await sendMessage(chatId, "⚠️ Account not linked.\n\nPlease update your profile with your Chat ID: `" + chatId + "`")
    return
  }

  // 2. Fetch Inventory
  const { data: medications } = await supabase
    .from('medications')
    .select('name, current_stock, unit')
    .eq('user_id', profile.id)
    .gt('current_stock', 0) // Optional: only show available items

  if (!medications || medications.length === 0) {
    await sendMessage(chatId, "📦 Your inventory is empty.")
    return
  }

  // 3. Format Response
  let responseText = `📋 *Inventory Status for ${profile.full_name || 'User'}*:\n\n`
  medications.forEach((med) => {
    responseText += `• *${med.name}*: ${med.current_stock} ${med.unit || ''}\n`
  })

  await sendMessage(chatId, responseText)
}

async function sendMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  })
}
