"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="glass-panel-strong max-w-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-white">Rendering failure</h2>
          <p className="mt-3 text-sm text-slate-400">{error.message}</p>
          <button
            onClick={reset}
            className="mt-5 rounded-md border border-blue-400/20 bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-medium text-white"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
