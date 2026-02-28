import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export async function GET() {
  try {
    const rows = await prisma.emailCache.findMany()
    const cutoff = new Date(Date.now() - CACHE_MAX_AGE_MS)

    const scores: Record<string, { score: number; ts: number }> = {}
    const statuses: Record<string, { status: string; isNew: boolean; ts: number; jiraKey?: string }> = {}

    for (const row of rows) {
      if (row.score !== null && row.scoredAt && row.scoredAt > cutoff) {
        scores[row.emailId] = { score: row.score, ts: row.scoredAt.getTime() }
      }
      statuses[row.emailId] = {
        status: row.status,
        isNew: row.isNew,
        ts: row.updatedAt.getTime(),
        jiraKey: row.jiraKey ?? undefined,
      }
    }

    return NextResponse.json({ scores, statuses })
  } catch (err) {
    console.error("Cache GET error:", err)
    return NextResponse.json({ error: "Failed to load cache" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { scores, status } = body as {
      scores?: Record<string, { score: number; ts: number }>
      status?: { emailId: string; status: string; isNew: boolean; jiraKey?: string }
    }

    if (scores) {
      const upserts = Object.entries(scores).map(([emailId, { score, ts }]) =>
        prisma.emailCache.upsert({
          where: { emailId },
          update: { score, scoredAt: new Date(ts) },
          create: { emailId, score, scoredAt: new Date(ts) },
        })
      )
      await prisma.$transaction(upserts)
    }

    if (status) {
      await prisma.emailCache.upsert({
        where: { emailId: status.emailId },
        update: {
          status: status.status,
          isNew: status.isNew,
          ...(status.jiraKey !== undefined ? { jiraKey: status.jiraKey } : {}),
        },
        create: {
          emailId: status.emailId,
          status: status.status,
          isNew: status.isNew,
          jiraKey: status.jiraKey,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Cache POST error:", err)
    return NextResponse.json({ error: "Failed to save cache" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { emailIds, status, clearJiraKey } = await req.json() as {
      emailIds: string[]
      status: string
      clearJiraKey?: boolean
    }

    const updates = emailIds.map((emailId) =>
      prisma.emailCache.upsert({
        where: { emailId },
        update: {
          status,
          ...(clearJiraKey ? { jiraKey: null } : {}),
        },
        create: { emailId, status },
      })
    )
    await prisma.$transaction(updates)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Cache PATCH error:", err)
    return NextResponse.json({ error: "Failed to update cache" }, { status: 500 })
  }
}
