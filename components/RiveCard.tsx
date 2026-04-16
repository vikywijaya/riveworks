'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'

const RiveThumbnail = dynamic(() => import('./RiveThumbnail'), { ssr: false })

interface RiveCardProps {
  id: string
  title: string
  description?: string | null
  fileUrl: string
  thumbnailUrl?: string | null
  bgColor?: string | null
  index?: number
}

export default function RiveCard({ id, title, description, fileUrl, thumbnailUrl, bgColor, index = 0 }: RiveCardProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/rive/${id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const num = (index + 1).toString().padStart(2, '0')

  return (
    <Link
      href={`/rive/${id}`}
      className="block group relative bg-dark-bg hover:bg-dark-card transition-colors duration-200 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="aspect-square relative overflow-hidden">
        <RiveThumbnail fileUrl={fileUrl} thumbnailUrl={thumbnailUrl} bgColor={bgColor} />

        {/* Index number — top left */}
        <span
          className="absolute top-3 left-3 text-[10px] text-white/30 z-10 leading-none"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {num}
        </span>

        {/* Copy button — top right, appears on hover */}
        <button
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy link'}
          className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-7 h-7 flex items-center justify-center bg-dark-bg/80 backdrop-blur-sm border border-dark-border hover:border-ink-faint"
        >
          {copied ? (
            <svg className="w-3 h-3 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-ink-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
        </button>

        {/* Bottom reveal strip on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-ink/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>

      {/* Card footer */}
      <div className="px-4 py-3 border-t border-dark-border">
        <h3
          className="text-sm text-ink leading-tight truncate group-hover:text-white transition-colors duration-150"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="text-[11px] text-ink-dim mt-0.5 truncate leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {description}
          </p>
        )}
      </div>
    </Link>
  )
}
