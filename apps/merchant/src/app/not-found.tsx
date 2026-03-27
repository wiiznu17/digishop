import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-medium tracking-widest uppercase opacity-60">
          404 Error
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Page not found</h1>
        <p className="mt-3 max-w-xl text-balance text-base opacity-70">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Check the URL, or pick one of the options below.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/orders"
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Go to Home
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            View Orders
          </Link>
        </div>

        <p className="mt-6 text-xs opacity-50">
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    </main>
  )
}
