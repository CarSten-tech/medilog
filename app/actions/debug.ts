"use server"

import { headers } from "next/headers"

export async function triggerStockCheck() {
    // Determine base URL dynamically
    const headerList = await headers()
    const host = headerList.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    
    const functionUrl = `${protocol}://${host}/api/cron/check-notifications`

    console.log("Triggering Cron at:", functionUrl)

    try {
        const response = await fetch(functionUrl, {
            method: 'GET', // Vercel Cron uses GET by default
            cache: 'no-store'
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
