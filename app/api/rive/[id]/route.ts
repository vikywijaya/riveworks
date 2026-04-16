import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const { title, description, thumbnailData, thumbnailName, bgColor, removeThumbnail } = await request.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const docRef = adminDb.collection('rives').doc(id)
  const doc = await docRef.get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = doc.data() as Record<string, string | null>

  const update: Record<string, unknown> = {
    title: title.trim(),
    description: description?.trim() || null,
    bgColor: bgColor || null,
    updatedAt: new Date(),
  }

  // Remove existing thumbnail
  if (removeThumbnail && existing.thumbnailBlobPathname) {
    await del(existing.thumbnailUrl as string)
    update.thumbnailUrl = null
    update.thumbnailBlobPathname = null
  }

  // Upload new thumbnail
  if (thumbnailData && thumbnailName) {
    // Delete old thumbnail if exists
    if (existing.thumbnailBlobPathname) {
      try { await del(existing.thumbnailUrl as string) } catch { /* ignore */ }
    }
    const ext = thumbnailName.split('.').pop() ?? 'jpg'
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    const thumbBuffer = Buffer.from(thumbnailData, 'base64')
    const thumbBlob = await put(`thumbnails/${Date.now()}_${thumbnailName}`, thumbBuffer, {
      access: 'public',
      contentType: mimeType,
    })
    update.thumbnailUrl = thumbBlob.url
    update.thumbnailBlobPathname = thumbBlob.pathname
  }

  await docRef.update(update)
  return NextResponse.json({ success: true, thumbnailUrl: update.thumbnailUrl ?? existing.thumbnailUrl })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const docRef = adminDb.collection('rives').doc(id)
  const doc = await docRef.get()

  if (!doc.exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { fileUrl, blobPathname, thumbnailUrl, thumbnailBlobPathname } =
    doc.data() as { fileUrl?: string; blobPathname?: string | null; thumbnailUrl?: string | null; thumbnailBlobPathname?: string | null }

  if (fileUrl && blobPathname) await del(fileUrl)
  if (thumbnailUrl && thumbnailBlobPathname) await del(thumbnailUrl)

  await docRef.delete()
  return NextResponse.json({ success: true })
}
