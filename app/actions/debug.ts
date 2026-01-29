"use server"

export async function triggerStockCheck() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    // Hardcoded project ref if env var is missing/generic, but cleaner to use env
    // Based on previous deployment logs, function URL is:
    // https://uzuqtycrrwsetbnigrfo.supabase.co/functions/v1/cron-stock-alert
    
    // We can construct it dynamically:
    const functionUrl = `${supabaseUrl}/functions/v1/cron-stock-alert`

    console.log("Triggering Cron at:", functionUrl)

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Failed: ${response.status} ${text}`)
        }

        const data = await response.json()
        return { success: true, data }
    } catch (error: any) {
        console.error("Cron Trigger Error:", error)
        return { success: false, error: error.message }
    }
}
