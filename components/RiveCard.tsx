'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'

const RivePlayer = dynamic(() => import('./RivePlayer'), { ssr: false })

interface RiveCardProps {
  id: string
  title: string
  description?: string | null
  fileUrl: string
}

export default function RiveCard({ id, title, description, fileUrl }: RiveCardProps) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/rive/${id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Link
      href={`/rive/${id}`}
      className="block group relative bg-dark-card rounded-2xl overflow-hidden border border-dark-border hover:border-zinc-600 transition-all duration-300 hover:shadow-2xl hover:shadow-accent-purple/10 hover:-translate-y-0.5 animate-slide-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rive canvas */}
      <div className="aspect-square bg-dark-bg relative overflow-hidden">
        <RivePlayer
          fileUrl={fileUrl}
          className="w-full h-full"
          playing={hovered}
        />
        {/* Subtle inner glow on hover */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-t-2xl pointer-events-none group-hover:ring-accent-purple/20 transition-all duration-300" />
      </div>

      {/* Card footer */}
      <div className="p-4 border-t border-dark-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-base leading-tight truncate">
              {title}
            </h3>
            {description && (
              <p className="text-zinc-400 text-sm mt-1 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Copy link button */}
          <button
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy link'}
            className="shrink-0 mt-0.5 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            {copied ? (
              <svg className="w-4 h-4 text-accent-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Bottom accent line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-purple via-accent-blue to-accent-cyan scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </Link>
  )
}
