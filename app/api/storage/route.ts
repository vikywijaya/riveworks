import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let totalBytes = 0
    let count = 0
    let cursor: string | undefined

    do {
      const res = await list({ limit: 1000, cursor })
      for (const b of res.blobs) {
        totalBytes += b.size
        count += 1
      }
      cursor = res.cursor
    } while (cursor)

    return NextResponse.json(
      { totalBytes, count },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
