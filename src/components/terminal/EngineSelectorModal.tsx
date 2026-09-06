'use client';

import React from 'react';
import { EngineInfo, EngineType } from '../../lib/engines/engine-manager';
import { X, Server, Webhook, Coins, Landmark, CheckCircle2, ShieldCheck } from 'lucide-react';

interface EngineSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  engines: EngineInfo[];
  activeEngine: EngineType;
  onSelectEngine: (type: EngineType) => void;
}

export const EngineSelectorModal: React.FC<EngineSelectorModalProps> = ({
  isOpen,
  onClose,
  engines,
  activeEngine,
  onSelectEngine,
}) => {
  if (!isOpen) return null;

  const getEngineIcon = (type: EngineType) => {
    switch (type) {
      case 'SIMULATED_PAPER':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'TRADINGVIEW_WEBHOOK':
        return <Webhook className="w-5 h-5 text-sky-400" />;
      case 'CCXT_CRYPTO':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'ALPACA_EQUITY':
        return <Landmark className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-trading-surface border border-trading-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-trading-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-trading-accent" />
            <h2 className="text-base font-bold text-white">Trade Engine & Broker Integration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-trading-muted hover:text-white hover:bg-trading-card transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Cards */}
        <div className="space-y-3">
          {engines.map((eng) => {
            const isSelected = activeEngine === eng.type;
            return (
              <div
                key={eng.type}
                onClick={() => onSelectEngine(eng.type)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                  isSelected
                    ? 'bg-trading-card border-trading-accent/60 shadow-md ring-1 ring-trading-accent/30'
                    : 'bg-trading-bg hover:bg-trading-card/60 border-trading-border'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-trading-surface border border-trading-border/80 flex-shrink-0">
                  {getEngineIcon(eng.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{eng.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-trading-surface text-trading-muted border border-trading-border">
                        {eng.badge}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktiv
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-trading-muted leading-relaxed mb-2">
                    {eng.description}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <span className="text-trading-muted">
                      Fokus: <strong className="text-white">{eng.assetFocus}</strong>
                    </span>
                    <span className="text-trading-muted">
                      Status:{' '}
                      <span className="text-emerald-400 font-semibold">
                        {eng.status === 'CONNECTED' ? 'Bereit & Verbunden' : 'Simulationsmodus'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-center text-xs text-trading-muted font-mono">
          Alle Engines unterstützen risikofreie Simulationen ohne zwingende Einzahlung oder Haftungsrisiko.
        </div>
      </div>
    </div>
  );
};
