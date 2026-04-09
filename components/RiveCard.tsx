'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

const RivePlayer = dynamic(() => import('./RivePlayer'), { ssr: false })

interface RiveCardProps {
  id: string
  title: string
  description?: string | null
  fileUrl: string
}

export default function RiveCard({ id, title, description, fileUrl }: RiveCardProps) {
  return (
    <Link href={`/rive/${id}`} className="block group relative bg-dark-card rounded-2xl overflow-hidden border border-dark-border hover:border-zinc-600 transition-all duration-300 hover:shadow-2xl hover:shadow-accent-purple/10 hover:-translate-y-0.5 animate-slide-up">
      {/* Rive canvas */}
      <div className="aspect-square bg-dark-bg relative overflow-hidden">
        <RivePlayer
          fileUrl={fileUrl}
          className="w-full h-full"
        />
        {/* Subtle inner glow on hover */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-t-2xl pointer-events-none group-hover:ring-accent-purple/20 transition-all duration-300" />
      </div>

      {/* Card footer */}
      <div className="p-4 border-t border-dark-border">
        <h3 className="font-semibold text-white text-base leading-tight truncate">
          {title}
        </h3>
        {description && (
          <p className="text-zinc-400 text-sm mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Bottom accent line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-purple via-accent-blue to-accent-cyan scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </Link>
  )
}
