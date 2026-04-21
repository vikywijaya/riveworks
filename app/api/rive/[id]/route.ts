import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await request.json()
  const { title, description, thumbnailData, thumbnailName, bgColor, removeThumbnail, featured, allowEmbed, allowDownload, thumbnailArtboard } = body

  // Allow flag-only updates without requiring title
  if (featured === undefined && allowEmbed === undefined && allowDownload === undefined && thumbnailArtboard === undefined && !title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const docRef = adminDb.collection('rives').doc(id)
  const doc = await docRef.get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = doc.data() as Record<string, string | null>

  // Featured-only toggle: unfeature all others first, then set this one
  if (featured === true) {
    const all = await adminDb.collection('rives').where('featured', '==', true).get()
    const batch = adminDb.batch()
    all.docs.forEach(d => { if (d.id !== id) batch.update(d.ref, { featured: false }) })
    await batch.commit()
  }

  const update: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (featured !== undefined) update.featured = featured
  if (allowEmbed !== undefined) update.allowEmbed = allowEmbed
  if (allowDownload !== undefined) update.allowDownload = allowDownload
  if (thumbnailArtboard !== undefined) update.thumbnailArtboard = thumbnailArtboard

  if (title?.trim()) {
    update.title = title.trim()
    update.description = description?.trim() || null
    update.bgColor = bgColor || null
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
