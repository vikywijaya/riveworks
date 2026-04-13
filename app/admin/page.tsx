'use client'

import { useState, useEffect, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

interface RiveFile {
  id: string
  title: string
  description: string | null
  originalName: string
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<RiveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  // Upload form state
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState('')
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
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    if (uploadMode === 'url') {
      try {
        setUploadProgress(50)
        const res = await fetch('/api/rive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            fileUrl: fileUrl.trim(),
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
      try {
        const base64 = (event.target?.result as string).split(',')[1]
        setUploadProgress(60)

        const res = await fetch('/api/rive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            fileData: base64,
            originalName: selectedFile!.name,
          }),
        })

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
      const res = await fetch(`/api/rive/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle.trim(), description: editingDescription.trim() || null }),
      })
      if (res.ok) {
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, title: editingTitle.trim(), description: editingDescription.trim() || null } : f))
        setEditingId(null)
      } else {
        alert('Failed to update title')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setSavingId(null)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-dark-border bg-dark-bg/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo height={22} className="text-white" />
              <div>
                <span className="ml-2 text-xs text-zinc-500 font-medium uppercase tracking-widest">
                  Admin
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg border border-dark-border hover:border-zinc-600"
              >
                View Gallery
              </a>
              <button
                onClick={handleLogout}
                className="text-sm text-zinc-400 hover:text-red-400 transition-colors duration-200 px-3 py-1.5 rounded-lg border border-dark-border hover:border-red-500/40"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Page title */}
          <div className="mb-10 animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-zinc-500 text-sm">
              Upload and manage your Rive animation files.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Upload panel */}
            <div className="lg:col-span-2">
              <div className="bg-dark-card border border-dark-border rounded-2xl p-6 animate-slide-up sticky top-24">
                <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-accent-purple/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-accent-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  Upload Animation
                </h2>

                <form onSubmit={handleUpload} className="space-y-4">
                  {/* Mode toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-dark-border">
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${uploadMode === 'file' ? 'bg-accent-purple text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${uploadMode === 'url' ? 'bg-accent-purple text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                      From URL
                    </button>
                  </div>

                  {/* File input */}
                  {uploadMode === 'file' && <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                      Rive File (.riv)
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedFile
                          ? 'border-accent-purple/60 bg-accent-purple/5'
                          : 'border-dark-border hover:border-zinc-600 bg-dark-bg'
                      }`}
                    >
                      {selectedFile ? (
                        <>
                          <svg className="w-7 h-7 text-accent-purple mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-accent-purple font-medium truncate max-w-[180px] px-2">
                            {selectedFile.name}
                          </span>
                          <span className="text-xs text-zinc-500 mt-0.5">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="w-7 h-7 text-zinc-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <span className="text-sm text-zinc-500">Click to select a .riv file</span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".riv"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>}

                  {/* URL input */}
                  {uploadMode === 'url' && <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                      Rive File URL
                    </label>
                    <input
                      type="url"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://example.com/animation.riv"
                      required={uploadMode === 'url'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/40 transition-all duration-200"
                    />
                  </div>}

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Animation title"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/40 transition-all duration-200"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/40 transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Upload progress */}
                  {uploading && (
                    <div className="animate-fade-in">
                      <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                        <span>Saving to Firestore...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent-purple to-accent-blue transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Feedback messages */}
                  {error && (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      {error}
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm animate-fade-in">
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {uploadSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading || !title.trim() || (uploadMode === 'file' ? !selectedFile : !fileUrl.trim())}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white font-semibold text-sm hover:opacity-90 active:opacity-80 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent-purple/20 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading... {uploadProgress}%
                      </>
                    ) : (
                      'Upload Animation'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Files list */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-accent-blue/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-accent-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 9h6M9 12h6M9 15h4" />
                    </svg>
                  </span>
                  Animations
                </h2>
                <span className="text-xs text-zinc-500 bg-dark-card border border-dark-border px-2.5 py-1 rounded-full">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-4 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-dark-border flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-dark-border rounded w-2/3" />
                          <div className="h-3 bg-dark-border rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <h3 className="text-zinc-300 font-medium mb-1">No animations uploaded yet</h3>
                  <p className="text-zinc-600 text-sm">Upload your first .riv file using the form on the left.</p>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="group bg-dark-card border border-dark-border hover:border-zinc-700 rounded-xl p-4 transition-all duration-200 flex items-center gap-4"
                    >
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 border border-dark-border flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-accent-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
                        </svg>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {editingId === file.id ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setEditingId(null)
                                }}
                                placeholder="Title"
                                className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-dark-bg border border-accent-purple text-white text-sm focus:outline-none"
                              />
                              <button
                                onClick={() => handleRename(file.id)}
                                disabled={savingId === file.id}
                                className="p-1.5 rounded-lg text-accent-purple hover:bg-accent-purple/10 transition-colors"
                              >
                                {savingId === file.id ? (
                                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 rounded-lg text-zinc-500 hover:bg-white/5 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <input
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                              placeholder="Description (optional)"
                              className="w-full px-2.5 py-1 rounded-lg bg-dark-bg border border-dark-border text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-accent-purple/60"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group/title">
                            <h3 className="font-semibold text-white text-sm truncate">{file.title}</h3>
                            <button
                              onClick={() => { setEditingId(file.id); setEditingTitle(file.title); setEditingDescription(file.description ?? '') }}
                              className="opacity-0 group-hover/title:opacity-100 p-1 rounded text-zinc-600 hover:text-zinc-300 transition-all"
                              title="Edit title"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {file.description && (
                          <p className="text-zinc-500 text-xs mt-0.5 truncate">{file.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-zinc-600 text-xs font-mono truncate max-w-[150px]">
                            {file.originalName}
                          </span>
                          <span className="text-zinc-700 text-xs">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(file.id, file.title)}
                        disabled={deletingId === file.id}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === file.id ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
