import { NextRequest, NextResponse } from 'next/server'
import { getById } from '@/lib/blob-db'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const record = await getById(params.id)
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!record.allowDownload) return NextResponse.json({ error: 'Download not allowed' }, { status: 403 })

  const res = await fetch(record.fileUrl)
  if (!res.ok) return NextResponse.json({ error: 'File unavailable' }, { status: 502 })

  const blob = await res.arrayBuffer()
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${record.originalName}"`,
    },
  })
}
