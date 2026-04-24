'use client'

import { useState, useEffect, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'

const ArtboardPicker = dynamic(() => import('@/components/ArtboardPicker'), { ssr: false })

interface RiveFile {
  id: string
  title: string
  description: string | null
  originalName: string
  fileUrl: string
  thumbnailUrl: string | null
  thumbnailArtboard: string | null
  bgColor: string | null
  featured: boolean
  allowEmbed: boolean
  allowDownload: boolean
  hidden: boolean
  createdAt: string
}

const mono = { fontFamily: "'DM Mono', monospace" } as const
const serif = { fontFamily: "'Instrument Serif', serif" } as const
const sans = { fontFamily: "'DM Sans', sans-serif" } as const

function titleFromFilename(name: string): string {
  const base = name.replace(/\.riv$/i, '').replace(/[_\-]+/g, ' ').trim()
  if (!base) return ''
  return base.replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function AdminPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const editThumbInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<RiveFile[]>([])
  const [storageBytes, setStorageBytes] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const [editingBgColor, setEditingBgColor] = useState('')
  const [editingThumbFile, setEditingThumbFile] = useState<File | null>(null)
  const [editingThumbPreview, setEditingThumbPreview] = useState<string | null>(null)
  const [editingRemoveThumb, setEditingRemoveThumb] = useState(false)
  const [editingThumbnailArtboard, setEditingThumbnailArtboard] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Upload form state
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState('#000000')
  const [error, setError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  async function fetchFiles() {
    try {
      const res = await fetch('/api/rive')
      if (res.ok) {
        const data = await res.json()
        setFiles(data)
      }
    } catch (err) {
      console.error('Failed to fetch files', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStorage() {
    try {
      const res = await fetch('/api/storage')
      if (res.ok) {
        const data = await res.json()
        setStorageBytes(data.totalBytes ?? 0)
      }
    } catch (err) {
      console.error('Failed to fetch storage', err)
    }
  }

  useEffect(() => {
    fetchFiles()
    fetchStorage()
  }, [])

  async function handleUpload(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (uploadMode === 'file' && !selectedFile) return
    if (uploadMode === 'url' && !fileUrl.trim()) return

    setUploading(true)
    setError('')
    setUploadSuccess('')
    setUploadProgress(0)

    const reset = () => {
      setTitle('')
      setDescription('')
      setSelectedFile(null)
      setFileUrl('')
      setThumbFile(null)
      setThumbPreview(null)
      setBgColor('#000000')
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (thumbInputRef.current) thumbInputRef.current.value = ''
    }

    const encodeThumb = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = (e) => resolve((e.target?.result as string).split(',')[1])
        r.onerror = reject
        r.readAsDataURL(file)
      })

    if (uploadMode === 'url') {
      try {
        setUploadProgress(50)
        let thumbnailData: string | undefined
        if (thumbFile) thumbnailData = await encodeThumb(thumbFile)
        const res = await fetch('/api/rive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            fileUrl: fileUrl.trim(),
            thumbnailData,
            thumbnailName: thumbFile?.name,
            bgColor: bgColor !== '#000000' ? bgColor : null,
          }),
        })
        setUploadProgress(100)
        if (res.ok) {
          const record = await res.json()
          setFiles((prev) => [record, ...prev])
          setUploadSuccess('Animation added successfully!')
          reset()
          fetchStorage()
          setTimeout(() => setUploadSuccess(''), 3000)
        } else {
          const data = await res.json()
          setError(data.error || 'Failed to save animation')
        }
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setUploading(false)
      }
      return
    }

    const reader = new FileReader()
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 50))
      }
    }
    reader.onload = async (event) => {
      let ticker: ReturnType<typeof setInterval> | null = null
      try {
        const base64 = (event.target?.result as string).split(',')[1]
        setUploadProgress(60)

        let fakeProgress = 60
        ticker = setInterval(() => {
          fakeProgress = Math.min(fakeProgress + 3, 90)
          setUploadProgress(fakeProgress)
        }, 200)

        let thumbnailData: string | undefined
        let thumbnailName: string | undefined
        if (thumbFile) {
          thumbnailData = await encodeThumb(thumbFile)
          thumbnailName = thumbFile.name
        }

        const res = await fetch('/api/rive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            fileData: base64,
            originalName: selectedFile!.name,
            thumbnailData,
            thumbnailName,
            bgColor: bgColor !== '#000000' ? bgColor : null,
          }),
        })

        clearInterval(ticker)
        setUploadProgress(100)

        if (res.ok) {
          const record = await res.json()
          setFiles((prev) => [record, ...prev])
          setUploadSuccess('Animation uploaded successfully!')
          reset()
          fetchStorage()
          setTimeout(() => setUploadSuccess(''), 3000)
        } else {
          const data = await res.json()
          setError(data.error || 'Failed to save animation')
        }
      } catch {
        if (ticker) clearInterval(ticker)
        setError('Something went wrong. Please try again.')
      } finally {
        setUploading(false)
      }
    }
    reader.onerror = () => {
      setError('Failed to read file.')
      setUploading(false)
    }
    reader.readAsDataURL(selectedFile!)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/rive/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id))
        fetchStorage()
      } else {
        alert('Failed to delete file')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleRename(id: string) {
    if (!editingTitle.trim()) return
    setSavingId(id)
    try {
      let thumbnailData: string | undefined
      let thumbnailName: string | undefined
      if (editingThumbFile) {
        thumbnailData = await new Promise<string>((resolve, reject) => {
          const r = new FileReader()
          r.onload = (e) => resolve((e.target?.result as string).split(',')[1])
          r.onerror = reject
          r.readAsDataURL(editingThumbFile)
        })
        thumbnailName = editingThumbFile.name
      }

      const res = await fetch(`/api/rive/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTitle.trim(),
          description: editingDescription.trim() || null,
          bgColor: editingBgColor || null,
          thumbnailData,
          thumbnailName,
          removeThumbnail: editingRemoveThumb,
          thumbnailArtboard: editingThumbnailArtboard,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setFiles((prev) => prev.map((f) => f.id === id ? {
          ...f,
          title: editingTitle.trim(),
          description: editingDescription.trim() || null,
          bgColor: editingBgColor || null,
          thumbnailUrl: editingRemoveThumb ? null : (data.thumbnailUrl ?? f.thumbnailUrl),
          thumbnailArtboard: editingThumbnailArtboard,
        } : f))
        setEditingId(null)
        setEditingThumbFile(null)
        setEditingThumbPreview(null)
        setEditingRemoveThumb(false)
        setEditingThumbnailArtboard(null)
      } else {
        alert('Failed to update title')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setSavingId(null)
    }
  }

  async function handleToggleFlag(id: string, field: 'allowEmbed' | 'allowDownload' | 'hidden', current: boolean) {
    const next = !current
    try {
      await fetch(`/api/rive/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: next }),
      })
      setFiles(prev => prev.map(f => {
        if (f.id !== id) return f
        const updated = { ...f, [field]: next }
        // Server clears featured when hidden=true — mirror here
        if (field === 'hidden' && next === true) updated.featured = false
        return updated
      }))
    } catch {
      alert('Something went wrong')
    }
  }

  async function handleSetFeatured(id: string, current: boolean) {
    const next = !current
    try {
      await fetch(`/api/rive/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: next }),
      })
      setFiles(prev => prev.map(f => ({ ...f, featured: f.id === id ? next : next ? false : f.featured })))
    } catch {
      alert('Something went wrong')
    }
  }

  async function handleCopyLink(id: string) {
    const url = `${window.location.origin}/rive/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1600)
    } catch {
      window.prompt('Copy link:', url)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const year = new Date().getFullYear()
  const featuredCount = files.filter(f => f.featured).length

  // Vercel Blob: no published hard cap on Hobby. Use 1 GB as a reference
  // for the progress bar visualization — adjust if your plan differs.
  const STORAGE_LIMIT_BYTES = 1024 ** 3
  const storageUsedBytes = storageBytes ?? 0
  const storagePct = Math.min(100, (storageUsedBytes / STORAGE_LIMIT_BYTES) * 100)
  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
    if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`
    return `${(b / 1024 ** 3).toFixed(2)} GB`
  }
  const storageColor = storagePct >= 90 ? '#f87171' : storagePct >= 70 ? '#fbbf24' : 'var(--accent)'

  // Shared style objects
  const labelStyle = { ...mono, display: 'block', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 8 }
  const fieldStyle = {
    ...sans,
    width: '100%',
    padding: '10px 12px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--ink)',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 150ms',
  }
  const monoFieldStyle = { ...fieldStyle, ...mono }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Logo height={22} className="text-ink" />
          <span style={{ ...mono, border: '1px solid var(--accent-line)', color: 'var(--accent)', padding: '4px 9px', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>
            Admin · v2
          </span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20, ...mono, fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
          <a href="/" style={{ color: 'var(--ink-dim)', textDecoration: 'none' }}>
            ← Gallery
          </a>
          <span>Entries&nbsp;<span style={{ color: 'var(--ink)' }}>{files.length.toString().padStart(2, '0')}</span></span>
          <span title={`${formatBytes(storageUsedBytes)} of ${formatBytes(STORAGE_LIMIT_BYTES)}`}>
            Storage&nbsp;<span style={{ color: storagePct >= 70 ? storageColor : 'var(--ink)' }}>
              {storageBytes === null ? '—' : formatBytes(storageUsedBytes)}
            </span>
          </span>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            style={{ ...mono, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-dim)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: 0 }}
          >
            Logout
          </button>
        </nav>
      </header>

      {/* ── Storage strip ── */}
      <div style={{ padding: '24px 36px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...mono, fontSize: 11, color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase' as const }}>
          <span style={{ width: 7, height: 7, background: 'var(--accent)', borderRadius: '50%', animation: 'blink 1.4s ease-in-out infinite', display: 'inline-block' }} />
          <span>Admin console / {year}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <InlineStat n={files.length} label="Entries" />
          <InlineStat n={featuredCount} label="Featured" />
          <InlineStat n={files.filter(f => f.hidden).length} label="Hidden" />
        </div>

        {/* Storage meter */}
        <div style={{ flex: 1, minWidth: 260, maxWidth: 440, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' as const }}>
              Storage
            </span>
            <span style={{ ...mono, fontSize: 11, color: 'var(--ink)', letterSpacing: '0.1em' }}>
              {storageBytes === null ? '— / —' : `${formatBytes(storageUsedBytes)} / ${formatBytes(STORAGE_LIMIT_BYTES)}`}
            </span>
          </div>
          <div style={{ width: '100%', height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${storagePct}%`,
              background: storageColor,
              transition: 'width 400ms, background 200ms',
            }} />
          </div>
          <div style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.15em', marginTop: 4 }}>
            {storageBytes === null ? 'measuring…' : `${storagePct.toFixed(1)}% of 1 GB reference`}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) 2fr', borderBottom: '1px solid var(--border)' }}>

        {/* ── Upload Panel ── */}
        <div style={{ padding: '48px 48px', borderRight: '1px solid var(--border)' }}>
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 18 }}>
              New entry
            </div>
            <h2 style={{ ...serif, fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em', margin: 0, marginBottom: 28, color: 'var(--ink)', fontWeight: 400 }}>
              Add a <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>work</em>
            </h2>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Mode toggle */}
              <div style={{ display: 'flex', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  style={{
                    ...mono,
                    flex: 1,
                    padding: '9px 0',
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase' as const,
                    background: uploadMode === 'file' ? 'var(--ink)' : 'transparent',
                    color: uploadMode === 'file' ? 'var(--bg)' : 'var(--ink-dim)',
                    border: 0,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  style={{
                    ...mono,
                    flex: 1,
                    padding: '9px 0',
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase' as const,
                    background: uploadMode === 'url' ? 'var(--ink)' : 'transparent',
                    color: uploadMode === 'url' ? 'var(--bg)' : 'var(--ink-dim)',
                    borderLeft: '1px solid var(--border)',
                    borderTop: 0,
                    borderRight: 0,
                    borderBottom: 0,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  URL
                </button>
              </div>

              {/* File drop zone */}
              {uploadMode === 'file' && (
                <div>
                  <label style={labelStyle}>.riv file</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      width: '100%', height: 108,
                      border: `1px dashed ${selectedFile ? 'var(--accent-line)' : 'var(--border)'}`,
                      background: selectedFile ? 'var(--bg-2)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    {selectedFile ? (
                      <div style={{ textAlign: 'center', padding: '0 16px' }}>
                        <p style={{ ...mono, fontSize: 12, color: 'var(--ink)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{selectedFile.name}</p>
                        <p style={{ ...mono, fontSize: 10, color: 'var(--ink-dim)', marginTop: 4, marginBottom: 0, letterSpacing: '0.1em' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <p style={{ ...mono, fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, margin: 0 }}>click to select</p>
                    )}
                    <input ref={fileInputRef} type="file" accept=".riv" style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null
                        setSelectedFile(f)
                        if (f && !title.trim()) setTitle(titleFromFilename(f.name))
                      }} />
                  </div>
                </div>
              )}

              {/* URL input */}
              {uploadMode === 'url' && (
                <div>
                  <label style={labelStyle}>URL</label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    onBlur={(e) => {
                      if (!title.trim() && e.target.value.trim()) {
                        try {
                          const name = new URL(e.target.value.trim()).pathname.split('/').pop() || ''
                          const t = titleFromFilename(name)
                          if (t) setTitle(t)
                        } catch {}
                      }
                    }}
                    placeholder="https://…/animation.riv"
                    required={uploadMode === 'url'}
                    style={monoFieldStyle}
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label style={labelStyle}>
                  Title <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Animation title"
                  required
                  style={fieldStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional…"
                  rows={2}
                  style={{ ...fieldStyle, resize: 'none' as const }}
                />
              </div>

              {/* Thumbnail */}
              <div>
                <label style={labelStyle}>Thumbnail</label>
                <div
                  onClick={() => thumbInputRef.current?.click()}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '100%', height: 76,
                    border: `1px dashed ${thumbFile ? 'var(--accent-line)' : 'var(--border)'}`,
                    background: thumbFile ? 'var(--bg-2)' : 'transparent',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 150ms',
                  }}
                >
                  {thumbPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbPreview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                      <span style={{ ...mono, position: 'relative', fontSize: 10, color: 'var(--ink)', background: 'var(--bg)', padding: '2px 8px', letterSpacing: '0.1em' }}>{thumbFile?.name}</span>
                    </>
                  ) : (
                    <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>click to select</span>
                  )}
                  <input ref={thumbInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null
                      setThumbFile(f)
                      if (f) { const r = new FileReader(); r.onload = ev => setThumbPreview(ev.target?.result as string); r.readAsDataURL(f) }
                      else setThumbPreview(null)
                    }} />
                </div>
              </div>

              {/* Background color */}
              <div>
                <label style={labelStyle}>Bg color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', padding: '8px 12px', background: 'var(--bg)' }}>
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                    style={{ width: 24, height: 24, cursor: 'pointer', background: 'transparent', border: 0, padding: 0, flexShrink: 0 }} />
                  <span style={{ ...mono, fontSize: 12, color: 'var(--ink-dim)', flex: 1, letterSpacing: '0.1em' }}>{bgColor}</span>
                  {bgColor !== '#000000' && (
                    <button type="button" onClick={() => setBgColor('#000000')}
                      style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', background: 'transparent', border: 0, cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>reset</button>
                  )}
                </div>
              </div>

              {/* Progress */}
              {uploading && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', ...mono, fontSize: 10, color: 'var(--ink-faint)', marginBottom: 6, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
                    <span>{uploadProgress < 50 ? 'reading…' : uploadProgress < 90 ? 'uploading…' : 'saving…'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 1, background: 'var(--border)' }}>
                    <div style={{ height: '100%', background: 'var(--accent)', transition: 'width 500ms', width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Feedback */}
              {error && (
                <p style={{ ...mono, fontSize: 11, color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.3)', padding: '8px 12px', margin: 0, letterSpacing: '0.05em' }}>{error}</p>
              )}
              {uploadSuccess && (
                <p style={{ ...mono, fontSize: 11, color: 'var(--accent)', border: '1px solid var(--accent-line)', padding: '8px 12px', margin: 0, letterSpacing: '0.05em' }}>{uploadSuccess}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading || !title.trim() || (uploadMode === 'file' ? !selectedFile : !fileUrl.trim())}
                style={{
                  ...mono,
                  width: '100%',
                  padding: '12px 0',
                  background: 'var(--ink)',
                  color: 'var(--bg)',
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase' as const,
                  border: 0,
                  cursor: 'pointer',
                  transition: 'opacity 150ms',
                  opacity: uploading || !title.trim() || (uploadMode === 'file' ? !selectedFile : !fileUrl.trim()) ? 0.3 : 1,
                }}
              >
                {uploading ? `Uploading ${uploadProgress}%` : 'Add animation'}
              </button>
            </form>
          </div>
        </div>

        {/* ── File list ── */}
        <div style={{ padding: '48px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                Entries
              </div>
              <h2 style={{ ...serif, fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)', fontWeight: 400 }}>
                All <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>works</em>
              </h2>
            </div>
            <span style={{ ...mono, fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
              {files.length.toString().padStart(2, '0')} total
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 88, background: 'var(--bg-2)', border: '1px solid var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 24px', gap: 14, textAlign: 'center', border: '1px solid var(--border)' }}>
              <p style={{ ...serif, fontSize: 28, color: 'var(--ink-dim)', margin: 0 }}>
                Nothing uploaded <em style={{ color: 'var(--accent)' }}>yet.</em>
              </p>
              <p style={{ ...mono, fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, margin: 0 }}>use the form to add your first animation</p>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border)' }}>
              {files.map((file, i) => (
                <div
                  key={file.id}
                  className="admin-row"
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: 18,
                    borderBottom: i === files.length - 1 ? 0 : '1px solid var(--border)',
                    transition: 'background 150ms',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: 60, height: 60, flexShrink: 0, overflow: 'hidden',
                      border: '1px solid var(--border)',
                      background: file.bgColor || 'var(--bg-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {file.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ ...mono, fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>{(i + 1).toString().padStart(2, '0')}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === file.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Title + save/cancel */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null) }}
                            placeholder="Title"
                            style={{ ...sans, flex: 1, minWidth: 0, padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--ink-faint)', color: 'var(--ink)', fontSize: 13, outline: 'none' }}
                          />
                          <button
                            onClick={() => handleRename(file.id)}
                            disabled={savingId === file.id}
                            style={{ ...mono, fontSize: 10, color: 'var(--ink)', border: '1px solid var(--border)', padding: '6px 10px', background: 'transparent', cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}
                          >
                            {savingId === file.id ? '…' : 'save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ ...mono, fontSize: 10, color: 'var(--ink-dim)', border: '1px solid var(--border)', padding: '6px 10px', background: 'transparent', cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}
                          >
                            esc
                          </button>
                        </div>
                        {/* Description */}
                        <input
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null) }}
                          placeholder="Description (optional)"
                          style={{ ...mono, width: '100%', padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)', fontSize: 12, outline: 'none' }}
                        />
                        {/* Artboard picker */}
                        <ArtboardPicker
                          fileUrl={file.fileUrl}
                          value={editingThumbnailArtboard}
                          onChange={setEditingThumbnailArtboard}
                          monoStyle={mono}
                        />
                        {/* Thumbnail + bg color row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                            {(editingThumbPreview || (file.thumbnailUrl && !editingRemoveThumb)) && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={editingThumbPreview || file.thumbnailUrl!} alt="" style={{ width: 28, height: 28, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                            )}
                            <button type="button" onClick={() => editThumbInputRef.current?.click()}
                              style={{ ...mono, fontSize: 10, color: 'var(--ink-dim)', background: 'transparent', border: 0, cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {editingThumbFile ? editingThumbFile.name : (file.thumbnailUrl && !editingRemoveThumb) ? 'change thumb' : 'add thumb'}
                            </button>
                            {(file.thumbnailUrl || editingThumbFile) && !editingRemoveThumb && (
                              <button type="button"
                                onClick={() => { setEditingRemoveThumb(true); setEditingThumbFile(null); setEditingThumbPreview(null); if (editThumbInputRef.current) editThumbInputRef.current.value = '' }}
                                style={{ ...mono, fontSize: 12, color: '#f87171', background: 'transparent', border: 0, cursor: 'pointer', flexShrink: 0 }}>
                                ×
                              </button>
                            )}
                            {editingRemoveThumb && <span style={{ ...mono, fontSize: 10, color: '#f87171', flexShrink: 0, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>will remove</span>}
                            <input ref={editThumbInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null
                                setEditingThumbFile(f); setEditingRemoveThumb(false)
                                if (f) { const r = new FileReader(); r.onload = ev => setEditingThumbPreview(ev.target?.result as string); r.readAsDataURL(f) }
                                else setEditingThumbPreview(null)
                              }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <input type="color" value={editingBgColor || '#000000'}
                              onChange={(e) => setEditingBgColor(e.target.value)}
                              style={{ width: 24, height: 24, cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }} title="Background color" />
                            <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>{editingBgColor || '#000000'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-title-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ ...sans, fontSize: 14, color: 'var(--ink)', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                          {file.title}
                        </h3>
                        {file.hidden && (
                          <span style={{ ...mono, fontSize: 9, color: 'var(--ink-faint)', border: '1px solid var(--border)', padding: '2px 6px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, flexShrink: 0 }}>
                            Hidden
                          </span>
                        )}
                        <button
                          className="admin-edit-btn"
                          onClick={() => {
                            setEditingId(file.id); setEditingTitle(file.title)
                            setEditingDescription(file.description ?? '')
                            setEditingBgColor(file.bgColor ?? '')
                            setEditingThumbFile(null); setEditingThumbPreview(null); setEditingRemoveThumb(false)
                            setEditingThumbnailArtboard(file.thumbnailArtboard ?? null)
                          }}
                          style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', background: 'transparent', padding: '3px 8px', border: '1px solid var(--border)', cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' as const, transition: 'all 150ms' }}
                        >
                          edit
                        </button>
                      </div>
                    )}
                    {editingId !== file.id && file.description && (
                      <p style={{ ...sans, fontSize: 12, color: 'var(--ink-dim)', margin: 0, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.description}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                      <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200, letterSpacing: '0.1em' }}>{file.originalName}</span>
                      <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Share link */}
                  <button
                    onClick={() => handleCopyLink(file.id)}
                    style={{
                      ...mono,
                      flexShrink: 0, alignSelf: 'center',
                      fontSize: 10, padding: '6px 10px', border: '1px solid',
                      background: 'transparent',
                      cursor: 'pointer',
                      borderColor: copiedId === file.id ? 'var(--accent-line)' : 'var(--border)',
                      color: copiedId === file.id ? 'var(--accent)' : 'var(--ink-faint)',
                      transition: 'all 150ms',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase' as const,
                    }}
                    title="Copy share link"
                  >
                    {copiedId === file.id ? 'Copied' : 'Link'}
                  </button>

                  {/* Visibility toggle — public checkbox */}
                  <button
                    onClick={() => handleToggleFlag(file.id, 'hidden', file.hidden)}
                    style={{
                      ...mono,
                      flexShrink: 0, alignSelf: 'center',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      fontSize: 10, padding: '6px 10px', border: '1px solid',
                      background: 'transparent',
                      cursor: 'pointer',
                      borderColor: file.hidden ? 'var(--border)' : 'var(--accent-line)',
                      color: file.hidden ? 'var(--ink-faint)' : 'var(--accent)',
                      transition: 'all 150ms',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase' as const,
                    }}
                    title={file.hidden ? 'Currently private — click to publish' : 'Currently public — click to make private'}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 12, height: 12,
                        border: '1px solid currentColor',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {!file.hidden && (
                        <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden>
                          <path d="M1.5 5.2 L4 7.7 L8.7 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" />
                        </svg>
                      )}
                    </span>
                    <span>Public</span>
                  </button>

                  {/* Embed toggle */}
                  <button
                    onClick={() => handleToggleFlag(file.id, 'allowEmbed', file.allowEmbed)}
                    style={{
                      ...mono,
                      flexShrink: 0, alignSelf: 'center',
                      fontSize: 11, padding: '6px 10px', border: '1px solid',
                      background: 'transparent',
                      cursor: 'pointer',
                      borderColor: file.allowEmbed ? 'var(--accent-line)' : 'var(--border)',
                      color: file.allowEmbed ? 'var(--accent)' : 'var(--ink-faint)',
                      transition: 'all 150ms',
                      letterSpacing: '0.1em',
                    }}
                    title={file.allowEmbed ? 'Disable embed' : 'Enable embed'}
                  >
                    &lt;/&gt;
                  </button>

                  {/* Download toggle */}
                  <button
                    onClick={() => handleToggleFlag(file.id, 'allowDownload', file.allowDownload)}
                    style={{
                      ...mono,
                      flexShrink: 0, alignSelf: 'center',
                      fontSize: 11, padding: '6px 10px', border: '1px solid',
                      background: 'transparent',
                      cursor: 'pointer',
                      borderColor: file.allowDownload ? 'var(--accent-line)' : 'var(--border)',
                      color: file.allowDownload ? 'var(--accent)' : 'var(--ink-faint)',
                      transition: 'all 150ms',
                      letterSpacing: '0.1em',
                    }}
                    title={file.allowDownload ? 'Disable download' : 'Enable download'}
                  >
                    ↓
                  </button>

                  {/* Featured star */}
                  <button
                    onClick={() => {
                      if (file.hidden) return alert('Un-hide first to feature this work')
                      handleSetFeatured(file.id, file.featured)
                    }}
                    style={{
                      flexShrink: 0, alignSelf: 'center',
                      fontSize: 18, lineHeight: 1,
                      background: 'transparent', border: 0,
                      cursor: file.hidden ? 'not-allowed' : 'pointer',
                      color: file.featured ? 'var(--accent)' : 'var(--ink-faint)',
                      opacity: file.hidden ? 0.4 : 1,
                      transition: 'color 150ms',
                    }}
                    title={file.hidden ? 'Hidden — cannot be featured' : file.featured ? 'Unfeature' : 'Set as featured'}
                  >
                    {file.featured ? '★' : '☆'}
                  </button>

                  {/* Delete */}
                  <button
                    className="admin-delete-btn"
                    onClick={() => handleDelete(file.id, file.title)}
                    disabled={deletingId === file.id}
                    style={{
                      ...mono,
                      flexShrink: 0, alignSelf: 'center',
                      fontSize: 10, padding: '6px 10px',
                      color: 'var(--ink-faint)',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase' as const,
                      opacity: deletingId === file.id ? 0.3 : 1,
                      transition: 'all 150ms',
                    }}
                    title="Delete"
                  >
                    {deletingId === file.id ? '…' : 'del'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 36px', borderTop: '1px solid var(--border)' }}>
        <Logo height={14} className="text-ink-faint" />
        <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>
          Admin · © {year} kidastudio
        </span>
      </footer>

      <style jsx>{`
        .admin-row:hover {
          background: var(--bg-2);
        }
        .admin-edit-btn {
          opacity: 0;
        }
        .admin-row:hover .admin-edit-btn,
        .admin-title-row:hover .admin-edit-btn {
          opacity: 1;
        }
        .admin-delete-btn {
          opacity: 0;
        }
        .admin-row:hover .admin-delete-btn {
          opacity: 1;
        }
        .admin-delete-btn:hover {
          color: #f87171 !important;
          border-color: rgba(248, 113, 113, 0.4) !important;
        }
        @media (max-width: 900px) {
          :global(.admin-row) {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  )
}

function InlineStat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 22, lineHeight: 1, color: 'var(--ink)' }}>{n}</span>
    </div>
  )
}
