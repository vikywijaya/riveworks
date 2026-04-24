import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { getById, updateRecord, deleteRecord, readAll, writeAll } from '@/lib/blob-db'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const record = await getById(id)
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(record, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await request.json()
  const { title, description, thumbnailData, thumbnailName, bgColor, removeThumbnail, featured, allowEmbed, allowDownload, hidden, thumbnailArtboard } = body

  if (featured === undefined && allowEmbed === undefined && allowDownload === undefined && hidden === undefined && thumbnailArtboard === undefined && !title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const existing = await getById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const patch: Record<string, unknown> = {}

  if (featured !== undefined) patch.featured = featured
  if (allowEmbed !== undefined) patch.allowEmbed = allowEmbed
  if (allowDownload !== undefined) patch.allowDownload = allowDownload
  if (hidden !== undefined) {
    patch.hidden = hidden
    if (hidden === true) patch.featured = false
  }
  if (thumbnailArtboard !== undefined) patch.thumbnailArtboard = thumbnailArtboard

  if (title?.trim()) {
    patch.title = title.trim()
    patch.description = description?.trim() || null
    patch.bgColor = bgColor || null
  }

  if (removeThumbnail && existing.thumbnailBlobPathname) {
    try { await del(existing.thumbnailUrl!) } catch { /* ignore */ }
    patch.thumbnailUrl = null
    patch.thumbnailBlobPathname = null
  }

  if (thumbnailData && thumbnailName) {
    if (existing.thumbnailBlobPathname) {
      try { await del(existing.thumbnailUrl!) } catch { /* ignore */ }
    }
    const ext = thumbnailName.split('.').pop() ?? 'jpg'
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    const thumbBlob = await put(`thumbnails/${Date.now()}_${thumbnailName}`, Buffer.from(thumbnailData, 'base64'), {
      access: 'public',
      contentType: mimeType,
    })
    patch.thumbnailUrl = thumbBlob.url
    patch.thumbnailBlobPathname = thumbBlob.pathname
  }

  // Featured exclusivity: unfeature all others in the same write
  if (featured === true) {
    const all = await readAll()
    const now = new Date().toISOString()
    const updated = all.map(r => ({
      ...r,
      ...(r.id === id ? patch : { featured: false }),
      updatedAt: now,
    }))
    await writeAll(updated)
    const result = updated.find(r => r.id === id)
    return NextResponse.json({ success: true, thumbnailUrl: result?.thumbnailUrl ?? existing.thumbnailUrl })
  }

  const updated = await updateRecord(id, patch as Parameters<typeof updateRecord>[1])
  return NextResponse.json({ success: true, thumbnailUrl: updated?.thumbnailUrl ?? existing.thumbnailUrl })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const record = await deleteRecord(id)
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (record.fileUrl && record.blobPathname) {
    try { await del(record.fileUrl) } catch { /* ignore */ }
  }
  if (record.thumbnailUrl && record.thumbnailBlobPathname) {
    try { await del(record.thumbnailUrl) } catch { /* ignore */ }
  }

  return NextResponse.json({ success: true })
}
