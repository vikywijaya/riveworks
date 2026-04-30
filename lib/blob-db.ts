import { put, list, del } from '@vercel/blob'

const METADATA_PATH = 'metadata/index.json'
const DELETED_PREFIX = 'metadata/deleted/'
const METADATA_CACHE_TTL_MS = 30_000

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

let metadataCache: { records: RiveRecord[]; updatedAt: number } | null = null

async function getMetadataUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: METADATA_PATH })
  const found = blobs.find((b) => b.pathname === METADATA_PATH)
  return found?.url ?? null
}

async function readDeletedIds(): Promise<Set<string>> {
  try {
    const { blobs } = await list({ prefix: DELETED_PREFIX, limit: 1000 })
    return new Set(
      blobs
        .map((b) => b.pathname.slice(DELETED_PREFIX.length).replace(/\.json$/, ''))
        .filter(Boolean),
    )
  } catch {
    return new Set()
  }
}

async function markDeleted(id: string): Promise<void> {
  await put(`${DELETED_PREFIX}${id}.json`, JSON.stringify({ id, deletedAt: new Date().toISOString() }), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

export async function readAll(): Promise<RiveRecord[]> {
  if (metadataCache && Date.now() - metadataCache.updatedAt < METADATA_CACHE_TTL_MS) {
    return metadataCache.records
  }

  try {
    const url = await getMetadataUrl()
    if (!url) return []

    const cacheBuster = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`
    const res = await fetch(cacheBuster, { cache: 'no-store' })
    if (!res.ok) return metadataCache?.records ?? []

    const deletedIds = await readDeletedIds()
    const records = (await res.json()).filter((record: RiveRecord) => !deletedIds.has(record.id))
    metadataCache = { records, updatedAt: Date.now() }
    return records
  } catch {
    return metadataCache?.records ?? []
  }
}

export async function writeAll(records: RiveRecord[]): Promise<void> {
  await put(METADATA_PATH, JSON.stringify(records), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  metadataCache = { records, updatedAt: Date.now() }
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
  if (idx === -1) {
    await markDeleted(id)
    metadataCache = { records: all.filter((r) => r.id !== id), updatedAt: Date.now() }
    return null
  }
  const [removed] = all.splice(idx, 1)
  await writeAll(all)
  await markDeleted(id)
  return removed
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export { del }
