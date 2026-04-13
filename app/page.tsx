import { adminDb } from '@/lib/firebase-admin'
import RiveCard from '@/components/RiveCard'
import Logo from '@/components/Logo'
import Link from 'next/link'

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
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
    }))

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Background mesh gradient */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-dark-border bg-dark-bg/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Logo height={24} className="text-white" />
            <Link
              href="/admin"
              className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg border border-dark-border hover:border-zinc-600"
            >
              Admin
            </Link>
          </div>
        </header>

        {/* Hero section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent-purple/10 border border-accent-purple/20 rounded-full px-4 py-1.5 text-sm text-accent-purple mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
            Interactive Animations
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Motion{' '}
            <span className="bg-gradient-to-r from-accent-purple via-accent-blue to-accent-cyan bg-clip-text text-transparent">
              Portfolio
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            A curated collection of interactive Rive animations — hover, click,
            and explore each piece.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <span>{riveFiles.length}</span>
            <span>{riveFiles.length === 1 ? 'animation' : 'animations'}</span>
          </div>
        </section>

        {/* Gallery grid */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {riveFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-zinc-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-300 mb-3">
                No animations yet
              </h2>
              <p className="text-zinc-500 text-center max-w-sm mb-8">
                The gallery is empty. Head to the admin dashboard to upload your
                first Rive file.
              </p>
              <Link
                href="/admin"
                className="px-6 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-accent-purple/25"
              >
                Go to Admin
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
              {riveFiles.map((file) => (
                <RiveCard
                  key={file.id}
                  id={file.id}
                  title={file.title}
                  description={file.description}
                  fileUrl={file.fileUrl}
                />
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-dark-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo height={16} className="text-zinc-400" />
            <p className="text-xs text-zinc-600">
              Built with Next.js &amp; Rive
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
