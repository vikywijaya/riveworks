import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = await adminDb
    .collection('rives')
    .orderBy('createdAt', 'desc')
    .get()

  const files = snapshot.docs.map(doc => {
    const { fileData, ...rest } = doc.data()
    return {
      id: doc.id,
      ...rest,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
    }
  })

  return NextResponse.json(files)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, fileData, originalName } = body

  if (!title || !fileData) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const docRef = await adminDb.collection('rives').add({
    title,
    description: description || null,
    fileData,
    originalName,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return NextResponse.json({ id: docRef.id, title, description, originalName })
}
