import { NextRequest, NextResponse } from "next/server"
import { fetchEmailsByLabels } from "@/lib/gmail"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Math.min(
      Number(searchParams.get("maxResults") ?? 20),
      50
    )

    const emails = await fetchEmailsByLabels(maxResults)
    return NextResponse.json({ emails, fetchedAt: new Date().toISOString() })
  } catch (error) {
    console.error("Failed to fetch emails:", error)
    const message =
      error instanceof Error ? error.message : "Unknown error fetching emails"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
