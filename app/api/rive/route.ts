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
  const { title, description, fileData, originalName, fileUrl: externalUrl } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  let fileUrl: string
  let blobPathname: string | null = null

  if (externalUrl) {
    // Use external/hosted URL directly — no blob upload
    fileUrl = externalUrl
  } else if (fileData && originalName) {
    // Upload file to Vercel Blob
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

  const docRef = await adminDb.collection('rives').add({
    title,
    description: description || null,
    originalName: originalName ?? new URL(fileUrl).pathname.split('/').pop() ?? 'external.riv',
    fileUrl,
    blobPathname,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return NextResponse.json({ id: docRef.id, title, description, fileUrl })
}
