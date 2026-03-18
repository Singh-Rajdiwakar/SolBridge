export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel-strong rounded-[1.6rem] px-6 py-5 text-center">
        <div className="page-kicker mx-auto w-fit">
          <span className="page-kicker-dot" />
          System booting
        </div>
        <div className="mt-4 text-lg font-semibold text-white">Loading Retix Wallet...</div>
      </div>
    </div>
  );
}
