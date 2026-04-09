import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('rives')
      .orderBy('createdAt', 'desc')
      .get()

    const files = snapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      }
    })

    return NextResponse.json(files)
  } catch (err) {
    console.error('GET /api/rive error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, fileData, originalName } = body

  if (!title || !fileData) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Upload file to Vercel Blob
  const buffer = Buffer.from(fileData, 'base64')
  const blob = await put(`rives/${Date.now()}_${originalName}`, buffer, {
    access: 'public',
    contentType: 'application/octet-stream',
  })

  // Store metadata + blob URL in Firestore
  const docRef = await adminDb.collection('rives').add({
    title,
    description: description || null,
    originalName,
    fileUrl: blob.url,
    blobPathname: blob.pathname,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return NextResponse.json({ id: docRef.id, title, description, originalName, fileUrl: blob.url })
}
