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
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const editThumbInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<RiveFile[]>([])
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

  useEffect(() => {
    fetchFiles()
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

    // Helper to encode thumb file to base64
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
          setUploadSuccess('Animation added successfully!')
          reset()
          await fetchFiles()
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

        // Animate progress from 60 → 90 while upload is in flight
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
          setUploadSuccess('Animation uploaded successfully!')
          reset()
          await fetchFiles()
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

  async function handleToggleFlag(id: string, field: 'allowEmbed' | 'allowDownload', current: boolean) {
    const next = !current
    try {
      await fetch(`/api/rive/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: next }),
      })
      setFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: next } : f))
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

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const monoStyle = { fontFamily: "'DM Mono', monospace" }
  const fieldCls = "w-full px-3 py-2 bg-dark-bg border border-dark-border text-ink placeholder-ink-faint text-sm focus:outline-none focus:border-ink-dim transition-colors duration-150"

  return (
    <div className="min-h-screen bg-dark-bg text-ink">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <header className="flex items-center justify-between py-7 border-b border-dark-border">
          <div className="flex items-center gap-5">
            <Logo height={28} className="text-ink" />
            <span className="text-[10px] text-ink-faint tracking-[0.25em] uppercase" style={monoStyle}>Admin</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-xs text-ink-dim hover:text-ink transition-colors duration-150 tracking-wide"
              style={monoStyle}
            >
              ← gallery
            </a>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="text-xs text-ink-dim hover:text-red-400 transition-colors duration-150 tracking-wide"
              style={monoStyle}
            >
              logout
            </button>
          </div>
        </header>

        {/* Page title row */}
        <div className="pt-12 pb-10 flex items-end justify-between border-b border-dark-border">
          <div>
            <p className="text-[10px] text-ink-faint tracking-[0.2em] uppercase mb-2" style={monoStyle}>Dashboard</p>
            <h1 className="text-[2.6rem] leading-none tracking-[-0.03em] text-ink font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Manage Animations
            </h1>
          </div>
          <span className="text-xs text-ink-faint pb-1" style={monoStyle}>
            {files.length.toString().padStart(2, '0')} entries
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-0 lg:gap-12 pt-10 pb-24">

          {/* ── Upload Panel ── */}
          <div className="sticky top-8 self-start">
            <p className="text-[10px] text-ink-faint tracking-[0.2em] uppercase mb-5" style={monoStyle}>New Entry</p>

            <form onSubmit={handleUpload} className="space-y-0">
              {/* Mode toggle */}
              <div className="flex border border-dark-border mb-5">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-2 text-[11px] tracking-wider transition-colors duration-150 ${uploadMode === 'file' ? 'bg-ink text-dark-bg' : 'text-ink-dim hover:text-ink'}`}
                  style={monoStyle}
                >
                  FILE
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-2 text-[11px] tracking-wider transition-colors duration-150 border-l border-dark-border ${uploadMode === 'url' ? 'bg-ink text-dark-bg' : 'text-ink-dim hover:text-ink'}`}
                  style={monoStyle}
                >
                  URL
                </button>
              </div>

              <div className="space-y-4">
                {/* File drop zone */}
                {uploadMode === 'file' && (
                  <div>
                    <label className="block text-[10px] text-ink-faint uppercase tracking-[0.15em] mb-1.5" style={monoStyle}>
                      .riv file
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center w-full h-28 border border-dashed cursor-pointer transition-colors duration-150 ${
                        selectedFile ? 'border-ink/40 bg-dark-card' : 'border-dark-border hover:border-ink-faint'
                      }`}
                    >
                      {selectedFile ? (
                        <div className="text-center px-4">
                          <p className="text-xs text-ink truncate" style={monoStyle}>{selectedFile.name}</p>
                          <p className="text-[10px] text-ink-dim mt-1" style={monoStyle}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ) : (
                        <p className="text-xs text-ink-faint" style={monoStyle}>click to select</p>
                      )}
                      <input ref={fileInputRef} type="file" accept=".riv" className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                )}

                {/* URL input */}
                {uploadMode === 'url' && (
                  <div>
                    <label className="block text-[10px] text-ink-faint uppercase tracking-[0.15em] mb-1.5" style={monoStyle}>
                      URL
                    </label>
                    <input
                      type="url"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://…/animation.riv"
                      required={uploadMode === 'url'}
                      className={fieldCls}
                      style={monoStyle}
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-[10px] text-ink-faint uppercase tracking-[0.15em] mb-1.5" style={monoStyle}>
                    title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Animation title"
                    required
                    className={fieldCls}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] text-ink-faint uppercase tracking-[0.15em] mb-1.5" style={monoStyle}>
                    description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional…"
                    rows={2}
                    className={`${fieldCls} resize-none`}
                  />
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-[10px] text-ink-faint uppercase tracking-[0.15em] mb-1.5" style={monoStyle}>
                    thumbnail
                  </label>
                  <div
                    onClick={() => thumbInputRef.current?.click()}
                    className={`relative flex items-center justify-center w-full h-20 border border-dashed cursor-pointer transition-colors duration-150 overflow-hidden ${
                      thumbFile ? 'border-ink/30 bg-dark-card' : 'border-dark-border hover:border-ink-faint'
                    }`}
                  >
                    {thumbPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbPreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        <span className="relative text-[10px] text-ink bg-dark-bg/80 px-2 py-0.5" style={monoStyle}>{thumbFile?.name}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-ink-faint" style={monoStyle}>click to select</span>
                    )}
                    <input ref={thumbInputRef} type="file" accept="image/*" className="hidden"
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
                  <label className="block text-[10px] text-ink-faint uppercase tracking-[0.15em] mb-1.5" style={monoStyle}>
                    bg color
                  </label>
                  <div className="flex items-center gap-3 border border-dark-border px-3 py-2 bg-dark-bg">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                      className="w-6 h-6 cursor-pointer bg-transparent border-0 p-0 flex-shrink-0" />
                    <span className="text-xs text-ink-dim flex-1" style={monoStyle}>{bgColor}</span>
                    {bgColor !== '#000000' && (
                      <button type="button" onClick={() => setBgColor('#000000')} className="text-[10px] text-ink-faint hover:text-ink transition-colors" style={monoStyle}>reset</button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                {uploading && (
                  <div>
                    <div className="flex justify-between text-[10px] text-ink-faint mb-1" style={monoStyle}>
                      <span>{uploadProgress < 50 ? 'reading…' : uploadProgress < 90 ? 'uploading…' : 'saving…'}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-px bg-dark-border">
                      <div className="h-full bg-ink transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {error && (
                  <p className="text-[11px] text-red-400 border border-red-900/40 px-3 py-2" style={monoStyle}>{error}</p>
                )}
                {uploadSuccess && (
                  <p className="text-[11px] text-green-400 border border-green-900/40 px-3 py-2" style={monoStyle}>{uploadSuccess}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={uploading || !title.trim() || (uploadMode === 'file' ? !selectedFile : !fileUrl.trim())}
                  className="w-full py-2.5 bg-ink text-dark-bg text-xs font-medium tracking-wider hover:bg-ink/90 active:bg-ink/80 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={monoStyle}
                >
                  {uploading ? `UPLOADING ${uploadProgress}%` : 'ADD ANIMATION'}
                </button>
              </div>
            </form>
          </div>

          {/* ── File list ── */}
          <div>
            <p className="text-[10px] text-ink-faint tracking-[0.2em] uppercase mb-5" style={monoStyle}>Entries</p>

            {loading ? (
              <div className="space-y-px">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-dark-card border border-dark-border animate-pulse" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-center border border-dark-border">
                <p className="text-ink-dim" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem' }}>Nothing uploaded yet</p>
                <p className="text-xs text-ink-faint" style={monoStyle}>use the form to add your first animation</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-border border border-dark-border">
                {files.map((file, i) => (
                  <div
                    key={file.id}
                    className="group flex gap-4 p-4 hover:bg-dark-card transition-colors duration-150"
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-14 h-14 flex-shrink-0 overflow-hidden border border-dark-border"
                      style={{ background: file.bgColor || '#161616' }}
                    >
                      {file.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[10px] text-ink-faint" style={monoStyle}>{(i + 1).toString().padStart(2, '0')}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {editingId === file.id ? (
                        <div className="flex flex-col gap-2">
                          {/* Title + save/cancel */}
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null) }}
                              placeholder="Title"
                              className="flex-1 min-w-0 px-2 py-1 bg-dark-bg border border-ink-faint text-ink text-sm focus:outline-none"
                            />
                            <button
                              onClick={() => handleRename(file.id)}
                              disabled={savingId === file.id}
                              className="text-[10px] text-ink border border-dark-border px-2 py-1 hover:bg-dark-card transition-colors"
                              style={monoStyle}
                            >
                              {savingId === file.id ? '…' : 'save'}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-[10px] text-ink-dim border border-dark-border px-2 py-1 hover:bg-dark-card transition-colors"
                              style={monoStyle}
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
                            className="w-full px-2 py-1 bg-dark-bg border border-dark-border text-ink text-xs placeholder-ink-faint focus:outline-none focus:border-ink-faint"
                            style={monoStyle}
                          />
                          {/* Artboard picker */}
                          <ArtboardPicker
                            fileUrl={file.fileUrl}
                            value={editingThumbnailArtboard}
                            onChange={setEditingThumbnailArtboard}
                            monoStyle={monoStyle}
                          />
                          {/* Thumbnail + bg color row */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {(editingThumbPreview || (file.thumbnailUrl && !editingRemoveThumb)) && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={editingThumbPreview || file.thumbnailUrl!} alt="" className="w-7 h-7 object-cover border border-dark-border flex-shrink-0" />
                              )}
                              <button type="button" onClick={() => editThumbInputRef.current?.click()}
                                className="text-[10px] text-ink-dim hover:text-ink transition-colors truncate" style={monoStyle}>
                                {editingThumbFile ? editingThumbFile.name : (file.thumbnailUrl && !editingRemoveThumb) ? 'change thumb' : 'add thumb'}
                              </button>
                              {(file.thumbnailUrl || editingThumbFile) && !editingRemoveThumb && (
                                <button type="button"
                                  onClick={() => { setEditingRemoveThumb(true); setEditingThumbFile(null); setEditingThumbPreview(null); if (editThumbInputRef.current) editThumbInputRef.current.value = '' }}
                                  className="text-[10px] text-red-400 hover:text-red-300 flex-shrink-0" style={monoStyle}>
                                  ×
                                </button>
                              )}
                              {editingRemoveThumb && <span className="text-[10px] text-red-400 flex-shrink-0" style={monoStyle}>will remove</span>}
                              <input ref={editThumbInputRef} type="file" accept="image/*" className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null
                                  setEditingThumbFile(f); setEditingRemoveThumb(false)
                                  if (f) { const r = new FileReader(); r.onload = ev => setEditingThumbPreview(ev.target?.result as string); r.readAsDataURL(f) }
                                  else setEditingThumbPreview(null)
                                }} />
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <input type="color" value={editingBgColor || '#000000'}
                                onChange={(e) => setEditingBgColor(e.target.value)}
                                className="w-6 h-6 cursor-pointer bg-transparent border-0 p-0" title="Background color" />
                              <span className="text-[10px] text-ink-faint" style={monoStyle}>{editingBgColor || '#000000'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="group/title flex items-center gap-2">
                          <h3 className="text-sm text-ink font-medium truncate leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {file.title}
                          </h3>
                          <button
                            onClick={() => {
                              setEditingId(file.id); setEditingTitle(file.title)
                              setEditingDescription(file.description ?? '')
                              setEditingBgColor(file.bgColor ?? '')
                              setEditingThumbFile(null); setEditingThumbPreview(null); setEditingRemoveThumb(false)
                              setEditingThumbnailArtboard(file.thumbnailArtboard ?? null)
                            }}
                            className="opacity-0 group-hover/title:opacity-100 text-[10px] text-ink-faint hover:text-ink transition-all px-1.5 py-0.5 border border-dark-border"
                            style={monoStyle}
                          >
                            edit
                          </button>
                        </div>
                      )}
                      {editingId !== file.id && file.description && (
                        <p className="text-xs text-ink-dim mt-0.5 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{file.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-ink-faint truncate max-w-[160px]" style={monoStyle}>{file.originalName}</span>
                        <span className="text-[10px] text-ink-faint" style={monoStyle}>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Embed toggle */}
                    <button
                      onClick={() => handleToggleFlag(file.id, 'allowEmbed', file.allowEmbed)}
                      className="flex-shrink-0 self-center text-[10px] px-2 py-1 border transition-colors"
                      style={{
                        ...monoStyle,
                        background: 'transparent',
                        cursor: 'pointer',
                        borderColor: file.allowEmbed ? 'var(--accent-line)' : 'var(--border)',
                        color: file.allowEmbed ? 'var(--accent)' : 'var(--ink-faint)',
                      }}
                      title={file.allowEmbed ? 'Disable embed' : 'Enable embed'}
                    >
                      &lt;/&gt;
                    </button>

                    {/* Download toggle */}
                    <button
                      onClick={() => handleToggleFlag(file.id, 'allowDownload', file.allowDownload)}
                      className="flex-shrink-0 self-center text-[10px] px-2 py-1 border transition-colors"
                      style={{
                        ...monoStyle,
                        background: 'transparent',
                        cursor: 'pointer',
                        borderColor: file.allowDownload ? 'var(--accent-line)' : 'var(--border)',
                        color: file.allowDownload ? 'var(--accent)' : 'var(--ink-faint)',
                      }}
                      title={file.allowDownload ? 'Disable download' : 'Enable download'}
                    >
                      ↓
                    </button>

                    {/* Featured star */}
                    <button
                      onClick={() => handleSetFeatured(file.id, file.featured)}
                      className="flex-shrink-0 self-center text-lg leading-none transition-all"
                      style={{ background: 'transparent', border: 0, cursor: 'pointer', color: file.featured ? 'var(--accent)' : 'var(--ink-faint)', opacity: file.featured ? 1 : undefined }}
                      title={file.featured ? 'Unfeature' : 'Set as featured'}
                    >
                      {file.featured ? '★' : '☆'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(file.id, file.title)}
                      disabled={deletingId === file.id}
                      className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 text-[10px] text-ink-faint hover:text-red-400 transition-all px-2 py-1 border border-dark-border disabled:opacity-30"
                      style={monoStyle}
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
      </div>
    </div>
  )
}
