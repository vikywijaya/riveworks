import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const { title, description } = await request.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const docRef = adminDb.collection('rives').doc(id)
  await docRef.update({ title: title.trim(), description: description?.trim() || null, updatedAt: new Date() })

  return NextResponse.json({ success: true })
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

  const { fileUrl } = doc.data() as { fileUrl?: string }

  // Delete from Vercel Blob if URL exists
  if (fileUrl) {
    await del(fileUrl)
  }

  await docRef.delete()

  return NextResponse.json({ success: true })
}
