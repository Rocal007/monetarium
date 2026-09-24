import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-trading-bg text-trading-text flex flex-col items-center justify-center p-4 font-mono">
      <div className="bg-trading-surface border border-trading-border rounded-xl p-8 max-w-md w-full text-center shadow-xl">
        <div className="text-4xl font-black text-rose-400 mb-2">404</div>
        <h2 className="text-lg font-bold text-white mb-2">Seite nicht gefunden</h2>
        <p className="text-xs text-trading-muted mb-6">
          Die angeforderte Route existiert nicht im Monetarium Trading-System.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-trading-accent text-black hover:bg-sky-400 transition"
        >
          Zurück zum Terminal
        </Link>
      </div>
    </div>
  );
}
