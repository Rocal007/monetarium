'use client';

import React, { useState, useMemo } from 'react';
import { Candle, TradeLog } from '../../lib/types/trading';
import { BarChart3, Layers, Maximize2 } from 'lucide-react';

interface ChartWidgetProps {
  candles: Candle[];
  trades: TradeLog[];
  symbol: string;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({ candles, trades, symbol }) => {
  const [timeframe, setTimeframe] = useState('1h');
  const [showEma, setShowEma] = useState(true);

  // SVG-Koordinaten-Berechnung
  const width = 800;
  const height = 420;
  const padding = { top: 20, right: 60, bottom: 40, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 1 };
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;
    for (const c of candles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }
    const margin = (max - min) * 0.05;
    return { minPrice: min - margin, maxPrice: max + margin, maxVolume: maxVol || 1 };
  }, [candles]);

  const priceRange = maxPrice - minPrice || 1;

  const getY = (price: number) => {
    return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const candleWidth = Math.max(2, Math.min(12, (chartWidth / (candles.length || 1)) * 0.7));

  // EMA Berechnungen für Chart
  const ema9 = useMemo(() => {
    if (candles.length < 9) return [];
    const k = 2 / 10;
    let val = candles[0].close;
    return candles.map((c) => {
      val = c.close * k + val * (1 - k);
      return val;
    });
  }, [candles]);

  const ema21 = useMemo(() => {
    if (candles.length < 21) return [];
    const k = 2 / 22;
    let val = candles[0].close;
    return candles.map((c) => {
      val = c.close * k + val * (1 - k);
      return val;
    });
  }, [candles]);

  const ema9Points = useMemo(() => {
    if (!showEma || ema9.length === 0) return '';
    return candles
      .map((_, i) => {
        const x = padding.left + (i / (candles.length - 1 || 1)) * chartWidth;
        const y = getY(ema9[i]);
        return `${x},${y}`;
      })
      .join(' ');
  }, [candles, ema9, showEma, chartWidth, minPrice, maxPrice]);

  const ema21Points = useMemo(() => {
    if (!showEma || ema21.length === 0) return '';
    return candles
      .map((_, i) => {
        const x = padding.left + (i / (candles.length - 1 || 1)) * chartWidth;
        const y = getY(ema21[i]);
        return `${x},${y}`;
      })
      .join(' ');
  }, [candles, ema21, showEma, chartWidth, minPrice, maxPrice]);

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 flex flex-col h-full">
      {/* Chart Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-trading-border/60 mb-2">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-trading-accent" />
            {symbol} Interaktiver Candlestick-Chart
          </span>
          <div className="flex bg-trading-bg rounded border border-trading-border text-[11px] font-mono">
            {['1m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 ${timeframe === tf ? 'bg-trading-card text-trading-accent font-bold' : 'text-trading-muted hover:text-white'}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setShowEma(!showEma)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition ${
              showEma
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-trading-bg text-trading-muted border-trading-border'
            }`}
          >
            <Layers className="w-3 h-3" />
            EMA (9, 21)
          </button>
          <span className="text-[10px] text-trading-muted font-mono">{candles.length} Kerzen geladen</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 min-h-[360px] w-full select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = padding.top + chartHeight * ratio;
            const price = maxPrice - ratio * priceRange;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left + chartWidth + 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {price.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Volume Bars */}
          {candles.map((c, i) => {
            const x = padding.left + (i / (candles.length - 1 || 1)) * chartWidth;
            const volHeight = (c.volume / maxVolume) * (chartHeight * 0.2);
            const isUp = c.close >= c.open;
            return (
              <rect
                key={`vol-${i}`}
                x={x - candleWidth / 2}
                y={padding.top + chartHeight - volHeight}
                width={candleWidth}
                height={volHeight}
                fill={isUp ? '#10B981' : '#F43F5E'}
                opacity="0.18"
              />
            );
          })}

          {/* Candlesticks */}
          {candles.map((c, i) => {
            const x = padding.left + (i / (candles.length - 1 || 1)) * chartWidth;
            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const isUp = c.close >= c.open;
            const color = isUp ? '#10B981' : '#F43F5E';
            const top = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(1.5, Math.abs(yOpen - yClose));

            return (
              <g key={`candle-${i}`}>
                {/* Wick */}
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" opacity="0.8" />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={top}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  rx="1"
                />
              </g>
            );
          })}

          {/* EMA Lines */}
          {showEma && (
            <>
              <polyline points={ema9Points} fill="none" stroke="#38BDF8" strokeWidth="1.5" opacity="0.9" />
              <polyline points={ema21Points} fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.9" />
            </>
          )}

          {/* Trade Execution Markers on Chart */}
          {trades.slice(-15).map((t, idx) => {
            const matchIndex = candles.findIndex((c) => Math.abs(c.timestamp - t.timestamp) < 3600 * 1000 * 2);
            if (matchIndex === -1) return null;
            const x = padding.left + (matchIndex / (candles.length - 1 || 1)) * chartWidth;
            const y = getY(t.price);
            const isBuy = t.side === 'BUY';

            return (
              <g key={`marker-${idx}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill={isBuy ? '#10B981' : '#F43F5E'}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={isBuy ? y + 14 : y - 8}
                  fill={isBuy ? '#10B981' : '#F43F5E'}
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {isBuy ? '▲ B' : '▼ S'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        {showEma && (
          <div className="absolute top-2 left-3 flex items-center gap-4 text-[10px] font-mono bg-trading-bg/80 px-2 py-1 rounded border border-trading-border/50 backdrop-blur-sm">
            <span className="text-sky-400 flex items-center gap-1">
              <span className="w-2 h-0.5 bg-sky-400"></span> EMA 9
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-0.5 bg-amber-400"></span> EMA 21
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
