import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const tickets = await prisma.requirementTicket.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(tickets)
  } catch (err) {
    console.error("Failed to fetch requirement tickets:", err)
    return NextResponse.json({ error: "获取工单列表失败" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, jiraKey, jiraUrl } = await req.json()

    if (!title) {
      return NextResponse.json({ error: "缺少标题" }, { status: 400 })
    }

    const ticket = await prisma.requirementTicket.create({
      data: {
        title,
        description: description || "",
        jiraKey: jiraKey || null,
        jiraUrl: jiraUrl || null,
        status: jiraKey ? "created" : "draft",
      },
    })

    return NextResponse.json(ticket)
  } catch (err) {
    console.error("Failed to create requirement ticket:", err)
    return NextResponse.json({ error: "创建工单记录失败" }, { status: 500 })
  }
}
