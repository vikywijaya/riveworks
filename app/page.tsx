import { adminDb } from '@/lib/firebase-admin'
import RiveCard from '@/components/RiveCard'
import Logo from '@/components/Logo'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import dynamicImport from 'next/dynamic'

const HeroAnimation = dynamicImport(() => import('@/components/HeroAnimation'), { ssr: false })

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const snapshot = await adminDb
    .collection('rives')
    .orderBy('createdAt', 'desc')
    .get()

  const riveFiles = snapshot.docs
    .filter(doc => !!doc.data().fileUrl)
    .map(doc => ({
      id: doc.id,
      title: doc.data().title as string,
      description: (doc.data().description ?? null) as string | null,
      fileUrl: doc.data().fileUrl as string,
      thumbnailUrl: (doc.data().thumbnailUrl ?? null) as string | null,
      bgColor: (doc.data().bgColor ?? null) as string | null,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
    }))

  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-dark-bg text-ink">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <header className="flex items-center justify-between py-7 border-b border-dark-border">
          <Logo height={28} className="text-ink" />
          <nav className="flex items-center gap-6">
            <span
              className="text-xs font-mono text-ink-dim tracking-[0.15em] uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {riveFiles.length.toString().padStart(2, '0')} works
            </span>
            <ThemeToggle />
            <Link
              href="/admin"
              className="text-xs text-ink-dim hover:text-ink transition-colors duration-150 tracking-wide"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              admin ↗
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="pt-16 pb-14">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Text */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              <p
                className="text-xs text-ink-dim tracking-[0.2em] uppercase"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Motion Portfolio — {year}
              </p>
              <h1
                className="text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.03em] text-ink font-normal"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Interactive<br />
                <em className="not-italic" style={{ color: '#888580' }}>Rive</em>{' '}
                Animations
              </h1>
              <p className="text-sm text-ink-dim max-w-sm leading-relaxed mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                A curated set of motion pieces — click to inspect states, variables, and transitions.
              </p>
            </div>

            {/* Rive hero animation */}
            <div className="w-full lg:w-[460px] h-[380px] flex-shrink-0">
              <HeroAnimation />
            </div>
          </div>
        </section>

        {/* Divider row */}
        <div className="flex items-center gap-6 pb-10 border-t border-dark-border pt-6">
          <span
            className="text-[10px] text-ink-faint tracking-[0.25em] uppercase"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Gallery
          </span>
          <div className="flex-1 h-px bg-dark-border" />
        </div>

        {/* Gallery */}
        <main className="pb-28">
          {riveFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6 text-center">
              <div
                className="text-[10px] tracking-[0.25em] uppercase text-ink-faint"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Empty
              </div>
              <p className="text-2xl text-ink-dim" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Nothing here yet
              </p>
              <Link
                href="/admin"
                className="mt-2 text-xs text-ink-dim border border-dark-border hover:border-ink-faint hover:text-ink px-5 py-2.5 transition-colors duration-150"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Open Admin →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-dark-border border border-dark-border">
              {riveFiles.map((file, i) => (
                <RiveCard
                  key={file.id}
                  id={file.id}
                  title={file.title}
                  description={file.description}
                  fileUrl={file.fileUrl}
                  thumbnailUrl={file.thumbnailUrl}
                  bgColor={file.bgColor}
                  index={i}
                />
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-dark-border py-7 flex items-center justify-between">
          <Logo height={16} className="text-ink-faint" />
          <p
            className="text-[10px] text-ink-faint tracking-[0.15em] uppercase"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Built with Next.js &amp; Rive
          </p>
        </footer>

      </div>
    </div>
  )
}
