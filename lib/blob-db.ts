import { put, list, del } from '@vercel/blob'

const METADATA_PATH = 'metadata/index.json'

export interface RiveRecord {
  id: string
  title: string
  description: string | null
  originalName: string
  fileUrl: string
  blobPathname: string | null
  thumbnailUrl: string | null
  thumbnailBlobPathname: string | null
  thumbnailArtboard: string | null
  bgColor: string | null
  featured: boolean
  allowEmbed: boolean
  allowDownload: boolean
  hidden: boolean
  createdAt: string
  updatedAt: string
}

async function getMetadataUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: METADATA_PATH })
  const found = blobs.find((b) => b.pathname === METADATA_PATH)
  return found?.url ?? null
}

export async function readAll(): Promise<RiveRecord[]> {
  try {
    const url = await getMetadataUrl()
    if (!url) return []
    // Bust Vercel Blob's CDN cache so writes are read-your-own-writes consistent
    const cacheBuster = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`
    const res = await fetch(cacheBuster, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function writeAll(records: RiveRecord[]): Promise<void> {
  await put(METADATA_PATH, JSON.stringify(records), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

export async function getById(id: string): Promise<RiveRecord | null> {
  const all = await readAll()
  return all.find((r) => r.id === id) ?? null
}

export async function insertRecord(record: RiveRecord): Promise<void> {
  const all = await readAll()
  all.unshift(record)
  await writeAll(all)
}

export async function updateRecord(id: string, patch: Partial<RiveRecord>): Promise<RiveRecord | null> {
  const all = await readAll()
  const idx = all.findIndex((r) => r.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() }
  await writeAll(all)
  return all[idx]
}

export async function deleteRecord(id: string): Promise<RiveRecord | null> {
  const all = await readAll()
  const idx = all.findIndex((r) => r.id === id)
  if (idx === -1) return null
  const [removed] = all.splice(idx, 1)
  await writeAll(all)
  return removed
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export { del }
