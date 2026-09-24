'use client';

import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Monetarium Client Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-trading-bg text-trading-text flex flex-col items-center justify-center p-4 font-mono">
      <div className="bg-trading-surface border border-rose-500/30 rounded-xl p-8 max-w-lg w-full text-center shadow-xl">
        <div className="text-3xl font-black text-rose-400 mb-2">System-Warnung</div>
        <h2 className="text-sm font-bold text-white mb-2">Laufzeitfehler im Terminal-UI</h2>
        <p className="text-xs text-rose-300/80 bg-rose-950/40 p-3 rounded border border-rose-900/50 mb-6 break-words font-mono text-left">
          {error.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-trading-accent text-black hover:bg-sky-400 transition"
        >
          Komponente neu laden
        </button>
      </div>
    </div>
  );
}
