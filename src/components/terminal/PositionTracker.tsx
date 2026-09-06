'use client';

import React, { useState } from 'react';
import { Order, Position, TradeLog } from '../../lib/types/trading';
import { Clock, DollarSign, ListOrdered, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PositionTrackerProps {
  positions: Record<string, Position>;
  pendingOrders: Order[];
  tradeHistory: TradeLog[];
  onClosePosition: (symbol: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export const PositionTracker: React.FC<PositionTrackerProps> = ({
  positions,
  pendingOrders,
  tradeHistory,
  onClosePosition,
  onCancelOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');

  const posList = Object.values(positions);

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-trading-border/60 pb-3 mb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'positions'
                ? 'bg-trading-card text-trading-accent border border-trading-accent/30'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Offene Positionen ({posList.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-trading-card text-trading-accent border border-trading-accent/30'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Ausstehende Orders ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-trading-card text-trading-accent border border-trading-accent/30'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Trade-Historie ({tradeHistory.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-x-auto min-h-[160px]">
        {activeTab === 'positions' && (
          posList.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-trading-muted font-mono">
              Keine aktiven Positionen im Paper Trading Portfolio.
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-trading-muted uppercase border-b border-trading-border/40">
                <tr>
                  <th className="pb-2">Asset</th>
                  <th className="pb-2">Seite</th>
                  <th className="pb-2">Menge</th>
                  <th className="pb-2">Einstieg</th>
                  <th className="pb-2">Marktpreis</th>
                  <th className="pb-2">SL / TP</th>
                  <th className="pb-2">Unrealisierter PnL</th>
                  <th className="pb-2 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trading-border/20">
                {posList.map((pos) => {
                  const isProfit = pos.unrealizedPnL >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-trading-bg/50 transition">
                      <td className="py-2.5 font-bold text-white">{pos.symbol}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          LONG
                        </span>
                      </td>
                      <td className="py-2.5 text-trading-text">{pos.amount.toFixed(4)}</td>
                      <td className="py-2.5 text-trading-muted">{pos.entryPrice.toLocaleString('de-DE')} €</td>
                      <td className="py-2.5 text-white">{pos.currentPrice.toLocaleString('de-DE')} €</td>
                      <td className="py-2.5 text-[11px] text-trading-muted">
                        {pos.stopLoss ? `SL: ${pos.stopLoss} €` : '-'} / {pos.takeProfit ? `TP: ${pos.takeProfit} €` : '-'}
                      </td>
                      <td className="py-2.5">
                        <span className={`font-bold flex items-center gap-1 ${isProfit ? 'text-trading-buy' : 'text-trading-sell'}`}>
                          {isProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isProfit ? '+' : ''}{pos.unrealizedPnL.toFixed(2)} € ({pos.unrealizedPnLPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onClosePosition(pos.symbol)}
                          className="px-2 py-1 rounded bg-trading-sell/20 hover:bg-trading-sell/30 text-trading-sell border border-trading-sell/30 text-[11px] transition"
                        >
                          Glattstellen
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {activeTab === 'orders' && (
          pendingOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-trading-muted font-mono">
              Keine ausstehenden Limit- oder Stop-Orders.
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-trading-muted uppercase border-b border-trading-border/40">
                <tr>
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">Asset</th>
                  <th className="pb-2">Typ</th>
                  <th className="pb-2">Seite</th>
                  <th className="pb-2">Menge</th>
                  <th className="pb-2">Trigger-Preis</th>
                  <th className="pb-2 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trading-border/20">
                {pendingOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-trading-bg/50 transition">
                    <td className="py-2.5 text-trading-muted text-[11px]">{ord.id.slice(-8)}</td>
                    <td className="py-2.5 font-bold text-white">{ord.symbol}</td>
                    <td className="py-2.5 text-trading-accent">{ord.type}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ord.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {ord.side}
                      </span>
                    </td>
                    <td className="py-2.5 text-trading-text">{ord.amount}</td>
                    <td className="py-2.5 text-white font-bold">{ord.price ?? ord.stopPrice ?? '-'} €</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onCancelOrder(ord.id)}
                        className="p-1 text-trading-muted hover:text-rose-400 transition"
                        title="Order stornieren"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {activeTab === 'history' && (
          tradeHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-trading-muted font-mono">
              Bislang keine abgeschlossenen Trades vorhanden.
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-trading-muted uppercase border-b border-trading-border/40">
                <tr>
                  <th className="pb-2">Zeit</th>
                  <th className="pb-2">Asset</th>
                  <th className="pb-2">Seite</th>
                  <th className="pb-2">Ausführungspreis</th>
                  <th className="pb-2">Menge</th>
                  <th className="pb-2">Gebühr</th>
                  <th className="pb-2 text-right">Realisierter PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trading-border/20">
                {tradeHistory.slice().reverse().map((trade) => (
                  <tr key={trade.id} className="hover:bg-trading-bg/50 transition">
                    <td className="py-2 text-[11px] text-trading-muted">
                      {new Date(trade.timestamp).toLocaleTimeString('de-DE')}
                    </td>
                    <td className="py-2 font-bold text-white">{trade.symbol}</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="py-2 text-white">{trade.price.toLocaleString('de-DE')} €</td>
                    <td className="py-2 text-trading-text">{trade.amount.toFixed(4)}</td>
                    <td className="py-2 text-trading-muted">{trade.fee.toFixed(2)} €</td>
                    <td className="py-2 text-right">
                      {trade.pnl !== undefined ? (
                        <span className={`font-bold ${trade.pnl >= 0 ? 'text-trading-buy' : 'text-trading-sell'}`}>
                          {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} €
                        </span>
                      ) : (
                        <span className="text-trading-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
};
