import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { readAll, insertRecord, generateId } from '@/lib/blob-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const files = await readAll()
    return NextResponse.json(files, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
  const body = await request.json()
  const { title, description, fileData, originalName, fileUrl: externalUrl, thumbnailData, thumbnailName, bgColor } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  let fileUrl: string
  let blobPathname: string | null = null

  if (externalUrl) {
    fileUrl = externalUrl
  } else if (fileData && originalName) {
    const buffer = Buffer.from(fileData, 'base64')
    const blob = await put(`rives/${Date.now()}_${originalName}`, buffer, {
      access: 'public',
      contentType: 'application/octet-stream',
    })
    fileUrl = blob.url
    blobPathname = blob.pathname
  } else {
    return NextResponse.json({ error: 'Provide either a file or a URL' }, { status: 400 })
  }

  let thumbnailUrl: string | null = null
  let thumbnailBlobPathname: string | null = null
  if (thumbnailData && thumbnailName) {
    const ext = thumbnailName.split('.').pop() ?? 'jpg'
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    const thumbBuffer = Buffer.from(thumbnailData, 'base64')
    const thumbBlob = await put(`thumbnails/${Date.now()}_${thumbnailName}`, thumbBuffer, {
      access: 'public',
      contentType: mimeType,
    })
    thumbnailUrl = thumbBlob.url
    thumbnailBlobPathname = thumbBlob.pathname
  }

  const now = new Date().toISOString()
  const record = {
    id: generateId(),
    title,
    description: description || null,
    originalName: originalName ?? new URL(fileUrl).pathname.split('/').pop() ?? 'external.riv',
    fileUrl,
    blobPathname,
    thumbnailUrl,
    thumbnailBlobPathname,
    thumbnailArtboard: null,
    bgColor: bgColor || null,
    featured: false,
    allowEmbed: false,
    allowDownload: false,
    hidden: false,
    createdAt: now,
    updatedAt: now,
  }

  await insertRecord(record)
  return NextResponse.json(record)
  } catch (err) {
    console.error('POST /api/rive error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
