import { readAll } from '@/lib/blob-db'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import { GallerySection } from '@/components/GallerySection'
import { FeaturedCard } from '@/components/FeaturedCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const allFiles = await readAll()
  const riveFiles = allFiles.filter(f => !f.hidden)

  const year = new Date().getFullYear()
  const mono = { fontFamily: "'DM Mono', monospace" }
  const serif = { fontFamily: "'Instrument Serif', serif" }
  const sans = { fontFamily: "'DM Sans', sans-serif" }

  const featured = riveFiles.find(f => f.featured) ?? riveFiles[0] ?? null

  return (
    <div className="min-h-screen bg-dark-bg text-ink" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Logo height={22} className="text-ink" />
          <span style={{ ...mono, border: '1px solid var(--accent-line)', color: 'var(--accent)', padding: '4px 9px', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>
            Index · v2
          </span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20, ...mono, fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
          <span>Works&nbsp;<span style={{ color: 'var(--ink)' }}>{riveFiles.length.toString().padStart(2, '0')}</span></span>
          <span>Year&nbsp;<span style={{ color: 'var(--ink)' }}>{year}</span></span>
          <ThemeToggle />
        </nav>
      </header>

      {/* ── Hero row — manifesto + featured ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) 2fr', borderBottom: '1px solid var(--border)' }}>

        {/* Manifesto column */}
        <div style={{ padding: '56px 48px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...mono, fontSize: 11, color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 7, height: 7, background: 'var(--accent)', borderRadius: '50%', animation: 'blink 1.4s ease-in-out infinite', display: 'inline-block' }} />
            <span>Motion portfolio / {year}</span>
          </div>
          <h1 style={{ ...serif, fontSize: 'clamp(48px, 5vw, 76px)', lineHeight: 0.94, letterSpacing: '-0.025em', margin: 0, color: 'var(--ink)', fontWeight: 400 }}>
            My Rive{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Animations</em>
            <br />Showcase
          </h1>
          <p style={{ ...sans, fontSize: 14, color: 'var(--ink-dim)', lineHeight: 1.65, maxWidth: 320, margin: 0 }}>
            Every piece exposes its skeleton — artboards, view-models, triggers, state machines.
          </p>
          <div style={{ marginTop: 'auto', paddingTop: 28, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <Stat n={riveFiles.length} label="Works" />
            <Stat n={riveFiles.length * 8} label="Variables" />
            <Stat n={riveFiles.length * 3} label="Triggers" />
          </div>
        </div>

        {/* Featured card */}
        {featured ? (
          <FeaturedCard
            id={featured.id}
            title={featured.title}
            description={featured.description}
            fileUrl={featured.fileUrl}
            thumbnailUrl={featured.thumbnailUrl}
            bgColor={featured.bgColor}
          />
        ) : (
          <div style={{ minHeight: 480, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ ...mono, fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>No works yet</span>
          </div>
        )}
      </div>

      {/* ── Filter + gallery ── */}
      <GallerySection files={riveFiles} />

      {/* ── Footer ── */}
      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 36px', borderTop: '1px solid var(--border)' }}>
        <Logo height={14} className="text-ink-faint" />
        <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>© {year} kidastudio</span>
      </footer>

    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 40, lineHeight: 1, color: 'var(--ink)' }}>{n}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
    </div>
  )
}
