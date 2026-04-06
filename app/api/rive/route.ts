import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = await adminDb
    .collection('rives')
    .orderBy('createdAt', 'desc')
    .get()

  const files = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
  }))

  return NextResponse.json(files)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, downloadUrl, filename, originalName } = body

  if (!title || !downloadUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const docRef = await adminDb.collection('rives').add({
    title,
    description: description || null,
    downloadUrl,
    filename,
    originalName,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return NextResponse.json({ id: docRef.id, title, description, downloadUrl, filename, originalName })
}
