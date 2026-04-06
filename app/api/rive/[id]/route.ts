import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

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

  const data = doc.data()!

  // Delete from Storage
  try {
    const bucket = adminStorage.bucket()
    await bucket.file(`rives/${data.filename}`).delete()
  } catch {
    // File may not exist in storage, continue
  }

  // Delete from Firestore
  await docRef.delete()

  return NextResponse.json({ success: true })
}
