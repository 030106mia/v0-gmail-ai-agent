import { NextRequest, NextResponse } from "next/server"
import { fetchEmailsByLabels } from "@/lib/gmail"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const emails = await fetchEmailsByLabels(30)
    console.log(
      `[Cron] Fetched ${emails.length} emails at ${new Date().toISOString()}`
    )
    return NextResponse.json({
      ok: true,
      count: emails.length,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] Failed to fetch emails:", error)
    const message =
      error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
