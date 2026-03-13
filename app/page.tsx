export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <main className="mx-4 flex w-full max-w-xl flex-col items-center gap-8 rounded-3xl bg-zinc-900 px-8 py-10 shadow-sm border border-zinc-800">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-semibold text-white shadow-md shadow-emerald-500/40">
            S
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
              SplitIA
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              AI powered daily expense assistant
            </p>
          </div>
        </div>
        <p className="text-sm text-zinc-300 text-center">
          Let SplitIA scan today&apos;s expense emails and quickly classify them
          in a WhatsApp-style chat. Perfect for hackathon demos and personal
          finance tracking.
        </p>
        <a
          href="/dashboard"
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-emerald-500 px-6 text-sm font-medium text-white shadow-md shadow-emerald-500/40 transition hover:bg-emerald-400"
        >
          Go to dashboard
        </a>
        <p className="text-[11px] text-zinc-500">
          When Gmail is not configured, the app will use mock expenses so the
          demo always works.
        </p>
      </main>
    </div>
  );
}
