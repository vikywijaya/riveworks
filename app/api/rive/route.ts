import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const riveFiles = await prisma.riveFile.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(riveFiles)
  } catch (error) {
    console.error('GET /api/rive error:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Validate file extension
    if (!file.name.endsWith('.riv')) {
      return NextResponse.json(
        { error: 'Only .riv files are allowed' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Sanitise and build a unique filename
    const sanitisedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${Date.now()}-${sanitisedName}`
    const rivesDir = path.join(process.cwd(), 'public', 'rives')

    // Ensure the directory exists
    await mkdir(rivesDir, { recursive: true })

    const filepath = path.join(rivesDir, filename)
    await writeFile(filepath, buffer)

    const riveFile = await prisma.riveFile.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        filename,
        originalName: file.name,
      },
    })

    return NextResponse.json(riveFile, { status: 201 })
  } catch (error) {
    console.error('POST /api/rive error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
