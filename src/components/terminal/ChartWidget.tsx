'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Candle, TradeLog } from '../../lib/types/trading';
import { BarChart3, Layers, Maximize2, Calendar, Clock } from 'lucide-react';

interface ChartWidgetProps {
  candles: Candle[];
  trades: TradeLog[];
  symbol: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
}

const INTRADAY_TIMEFRAMES = ['1m', '15m', '1h', '4h', '1d'];
const MACRO_HORIZONS = [
  { id: '1W', label: 'Woche (1W)', short: '1W' },
  { id: '1M', label: 'Monat (1M)', short: '1M' },
  { id: '1Q', label: 'Quartal (1Q)', short: '1Q' },
  { id: '1Y', label: 'Jahr (1J)', short: '1Y' },
  { id: '5Y', label: '5 Jahre (5J)', short: '5Y' },
  { id: '10Y', label: '10 Jahre (10J)', short: '10Y' },
];

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  candles,
  trades,
  symbol,
  timeframe: externalTimeframe,
  onTimeframeChange,
}) => {
  const [internalTimeframe, setInternalTimeframe] = useState('1h');
  const activeTimeframe = externalTimeframe || internalTimeframe;
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

  const getY = useCallback(
    (price: number) => {
      return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    },
    [chartHeight, minPrice, priceRange, padding.top]
  );

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
  }, [candles, ema9, showEma, chartWidth, getY, padding.left]);

  const ema21Points = useMemo(() => {
    if (!showEma || ema21.length === 0) return '';
    return candles
      .map((_, i) => {
        const x = padding.left + (i / (candles.length - 1 || 1)) * chartWidth;
        const y = getY(ema21[i]);
        return `${x},${y}`;
      })
      .join(' ');
  }, [candles, ema21, showEma, chartWidth, getY, padding.left]);

  const formatTimeLabel = useCallback((ts: number, tf: string) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    if (tf === '10Y' || tf === '5Y') {
      return d.getFullYear().toString();
    }
    if (tf === '1Y' || tf === '1Q') {
      const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      return `${monthNames[d.getMonth()]} '${d.getFullYear().toString().slice(-2)}`;
    }
    if (tf === '1M' || tf === '1W' || tf === '1d') {
      const day = String(d.getDate()).padStart(2, '0');
      const mon = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}.${mon}`;
    }
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }, []);

  const timeTicks = useMemo(() => {
    if (candles.length < 2) return [];
    const ticksCount = 5;
    const result: { x: number; label: string }[] = [];
    for (let i = 0; i < ticksCount; i++) {
      const idx = Math.min(candles.length - 1, Math.floor((i / (ticksCount - 1)) * (candles.length - 1)));
      const x = padding.left + (idx / (candles.length - 1 || 1)) * chartWidth;
      const label = formatTimeLabel(candles[idx].timestamp, activeTimeframe);
      result.push({ x, label });
    }
    return result;
  }, [candles, chartWidth, padding.left, activeTimeframe, formatTimeLabel]);

  const activeHorizonName = useMemo(() => {
    const found = MACRO_HORIZONS.find((h) => h.id === activeTimeframe);
    if (found) return found.label;
    return `Intraday (${activeTimeframe})`;
  }, [activeTimeframe]);

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-3 sm:p-4 flex flex-col h-full min-w-0 w-full">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-trading-border/60 mb-2 gap-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <span className="font-bold text-xs sm:text-sm tracking-wide text-white flex items-center gap-1.5 sm:gap-2 truncate">
            <BarChart3 className="w-4 h-4 text-trading-accent shrink-0" />
            <span className="truncate">{symbol} Interaktiver Chart</span>
          </span>

          {/* Intraday Timeframes */}
          <div className="flex bg-trading-bg rounded border border-trading-border text-[11px] font-mono shrink-0 items-center">
            <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-trading-muted border-r border-trading-border flex items-center gap-0.5 bg-trading-surface/60">
              <Clock className="w-2.5 h-2.5" />
              Intra
            </span>
            {INTRADAY_TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setInternalTimeframe(tf);
                  onTimeframeChange?.(tf);
                }}
                className={`px-1.5 sm:px-2 py-0.5 ${activeTimeframe === tf ? 'bg-trading-card text-trading-accent font-bold' : 'text-trading-muted hover:text-white'}`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Makro-Horizonte: Woche, Monat, Quartal, Jahr, 5 Jahre, 10 Jahre */}
          <div className="flex bg-trading-bg rounded border border-trading-border text-[11px] font-mono shrink-0 items-center">
            <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-emerald-400 border-r border-trading-border flex items-center gap-0.5 bg-emerald-500/10 font-bold">
              <Calendar className="w-2.5 h-2.5" />
              Horizonte
            </span>
            {MACRO_HORIZONS.map((h) => (
              <button
                key={h.id}
                title={h.label}
                onClick={() => {
                  setInternalTimeframe(h.id);
                  onTimeframeChange?.(h.id);
                }}
                className={`px-1.5 sm:px-2 py-0.5 transition ${
                  activeTimeframe === h.id
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border-b-2 border-emerald-400'
                    : 'text-trading-muted hover:text-white'
                }`}
              >
                {h.short}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
          <span className="text-[10px] text-emerald-400/90 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 hidden md:inline">
            {activeHorizonName}
          </span>
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
          <span className="text-[10px] text-trading-muted font-mono hidden sm:inline">{candles.length} Kerzen</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 min-h-[340px] sm:min-h-[360px] w-full select-none min-w-0 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
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

          {/* X-Axis Time Ticks */}
          {timeTicks.map((t, idx) => (
            <g key={`time-tick-${idx}`}>
              <line
                x1={t.x}
                y1={padding.top + chartHeight}
                x2={t.x}
                y2={padding.top + chartHeight + 4}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={t.x}
                y={padding.top + chartHeight + 16}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {t.label}
              </text>
            </g>
          ))}
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
