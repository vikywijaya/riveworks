import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const riveFile = await prisma.riveFile.findUnique({ where: { id } })

    if (!riveFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete the file from disk (best-effort — don't fail if already gone)
    try {
      const filepath = path.join(process.cwd(), 'public', 'rives', riveFile.filename)
      await unlink(filepath)
    } catch (fsError) {
      console.warn('Could not delete file from disk:', fsError)
    }

    // Delete the DB record
    await prisma.riveFile.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`DELETE /api/rive/${id} error:`, error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
