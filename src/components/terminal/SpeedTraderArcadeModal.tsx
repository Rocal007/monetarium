'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Gamepad2,
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  TrendingUp,
  TrendingDown,
  Flame,
  Zap,
  ShieldAlert,
  Bot,
  User,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ArcadeEngine,
  ArcadeGameState,
  ArcadeScenarioType,
  ArcadeCandle,
} from '../../lib/engines/arcade-engine';

interface SpeedTraderArcadeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpeedTraderArcadeModal: React.FC<SpeedTraderArcadeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const engineRef = useRef<ArcadeEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new ArcadeEngine();
  }

  const [gameState, setGameState] = useState<ArcadeGameState>(() =>
    engineRef.current!.getState()
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Subscribe to engine state
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const unsubscribe = engine.subscribe((newState) => {
      setGameState({ ...newState, candles: [...newState.candles] });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Input in Textfeldern ignorieren
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const engine = engineRef.current;
      if (!engine) return;

      const key = e.key.toLowerCase();
      if (key === 'l') {
        e.preventDefault();
        engine.openPosition('LONG', 0.5);
      } else if (key === 's') {
        e.preventDefault();
        engine.openPosition('SHORT', 0.5);
      } else if (key === 'c' || e.code === 'Space') {
        e.preventDefault();
        engine.closePosition();
      } else if (key === '1') {
        engine.setLeverage(1);
      } else if (key === '2') {
        engine.setLeverage(5);
      } else if (key === '3') {
        engine.setLeverage(10);
      } else if (key === '4') {
        engine.setLeverage(25);
      } else if (key === '5') {
        engine.setLeverage(50);
      } else if (key === 'arrowright' && gameState.scenario === 'BAR_BY_BAR') {
        e.preventDefault();
        engine.stepNextBar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, gameState.scenario]);

  if (!isOpen) return null;

  const engine = engineRef.current!;
  const { player, ai, currentPrice, candles, scenario, speedMultiplier, status, timeRemainingSec, totalRoundTimeSec, activeEvents } = gameState;

  const isGreen = player.unrealizedPnL >= 0;
  const totalPnL = player.realizedPnL + player.unrealizedPnL;
  const winRate = player.tradesCount > 0
    ? Math.round((player.winningTrades / player.tradesCount) * 100)
    : 0;

  // Render SVG Candlesticks
  const chartHeight = 260;
  const chartWidth = 680;

  const minPrice = useMemo(() => {
    if (candles.length === 0) return currentPrice * 0.99;
    return Math.min(...candles.map((c) => c.low)) * 0.998;
  }, [candles, currentPrice]);

  const maxPrice = useMemo(() => {
    if (candles.length === 0) return currentPrice * 1.01;
    return Math.max(...candles.map((c) => c.high)) * 1.002;
  }, [candles, currentPrice]);

  const priceRange = Math.max(1, maxPrice - minPrice);
  const getY = (p: number) => chartHeight - ((p - minPrice) / priceRange) * chartHeight;

  // Sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    engine.setSoundEnabled(next);
  };

  // Rank Evaluator
  const getRank = () => {
    if (player.isLiquidated) return { label: '💀 REKT & LIQUIDIERT', color: 'text-rose-500' };
    const pnlPct = (totalPnL / player.initialCash) * 100;
    if (pnlPct >= 50) return { label: '👑 QUANT GOD', color: 'text-amber-400' };
    if (pnlPct >= 20) return { label: '💎 CHAD TRADER', color: 'text-emerald-400' };
    if (pnlPct >= 0) return { label: '📈 MARKET MAKER', color: 'text-sky-400' };
    return { label: '📉 ROOKIE APPRENTICE', color: 'text-rose-400' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl shadow-emerald-500/10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900/90 px-5 py-3.5 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20 font-black">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wider text-white flex items-center gap-2">
                  MONETARIUM SPEED-TRADER ARCADE
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold animate-pulse">
                    Live Engine
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Real-Time Brownian Market Physics • Degen Leverage bis 50x • Hotkeys: <kbd className="bg-slate-800 px-1 rounded text-emerald-400">L</kbd> Long, <kbd className="bg-slate-800 px-1 rounded text-rose-400">S</kbd> Short, <kbd className="bg-slate-800 px-1 rounded text-amber-400">Space</kbd> Close
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border transition ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'Ton an' : 'Stumm'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Control Bar: Szenarien & Speed */}
        <div className="bg-slate-900/60 px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Szenarien */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(
              [
                { id: 'BULL_RUN', label: '🚀 Bull Run' },
                { id: 'FLASH_CRASH', label: '⚡ Flash Crash' },
                { id: 'WHALE_WHIPLASH', label: '🐋 Whale Whiplash' },
                { id: 'AI_DUEL', label: '🤖 AI Duell' },
                { id: 'BAR_BY_BAR', label: '⏳ Bar-by-Bar' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => engine.setScenario(s.id)}
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  scenario === s.id
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Speed Multiplier */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Speed:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {[1, 2, 5, 10, 20].map((spd) => (
                <button
                  key={spd}
                  onClick={() => engine.setSpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    speedMultiplier === spd
                      ? 'bg-sky-500 text-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Breaking News Event Ticker */}
        {activeEvents.length > 0 && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-1.5 flex items-center gap-2 overflow-hidden">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
            <div className="truncate text-xs font-mono text-amber-300 animate-pulse">
              {activeEvents[0].headline}
            </div>
          </div>
        )}

        {/* Main Cockpit Body */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-gradient-to-b from-slate-950 to-slate-900">
          {/* Left: Live SVG Candlestick Chart */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-slate-950/80 rounded-xl border border-slate-800 p-3 shadow-inner relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-black text-white">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {player.position !== 'NONE' && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      player.position === 'LONG'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {player.position} ({player.leverage}x) @ ${player.entryPrice.toFixed(0)}
                  </span>
                )}
              </div>

              {/* Runden-Timer oder Bar Step */}
              {scenario === 'BAR_BY_BAR' ? (
                <button
                  onClick={() => engine.stepNextBar()}
                  className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1"
                >
                  Nächste Kerze <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                  <span>Runde:</span>
                  <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${Math.max(0, (timeRemainingSec / totalRoundTimeSec) * 100)}%` }}
                    />
                  </div>
                  <span className="font-bold text-white">{Math.ceil(timeRemainingSec)}s</span>
                </div>
              )}
            </div>

            {/* SVG Chart */}
            <div className="w-full relative overflow-hidden bg-slate-900/40 rounded-lg border border-slate-800/80">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-64 select-none"
                preserveAspectRatio="none"
              >
                {/* Horizontal Grid lines */}
                {[0.25, 0.5, 0.75].map((pct) => (
                  <line
                    key={pct}
                    x1="0"
                    y1={chartHeight * pct}
                    x2={chartWidth}
                    y2={chartHeight * pct}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                {/* Entry Price Line */}
                {player.position !== 'NONE' && (
                  <line
                    x1="0"
                    y1={getY(player.entryPrice)}
                    x2={chartWidth}
                    y2={getY(player.entryPrice)}
                    stroke={player.position === 'LONG' ? '#10b981' : '#f43f5e'}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Liquidation Price Line */}
                {player.position !== 'NONE' && (
                  <line
                    x1="0"
                    y1={getY(player.liquidationPrice)}
                    x2={chartWidth}
                    y2={getY(player.liquidationPrice)}
                    stroke="#dc2626"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Candlesticks */}
                {candles.map((c, idx) => {
                  const x = (idx / Math.max(1, candles.length)) * (chartWidth - 20) + 10;
                  const isUp = c.close >= c.open;
                  const candleColor = isUp ? '#10b981' : '#f43f5e';
                  const yOpen = getY(c.open);
                  const yClose = getY(c.close);
                  const yHigh = getY(c.high);
                  const yLow = getY(c.low);
                  const bodyY = Math.min(yOpen, yClose);
                  const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
                  const candleWidth = Math.max(4, Math.floor(chartWidth / Math.max(1, candles.length) * 0.7));

                  return (
                    <g key={c.timestamp + idx}>
                      {/* Wick */}
                      <line
                        x1={x + candleWidth / 2}
                        y1={yHigh}
                        x2={x + candleWidth / 2}
                        y2={yLow}
                        stroke={candleColor}
                        strokeWidth="1"
                      />
                      {/* Body */}
                      <rect
                        x={x}
                        y={bodyY}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={candleColor}
                        rx="1"
                      />
                    </g>
                  );
                })}

                {/* Current Price Line */}
                <line
                  x1="0"
                  y1={getY(currentPrice)}
                  x2={chartWidth}
                  y2={getY(currentPrice)}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Liquidation Alert Badge */}
              {player.position !== 'NONE' && (
                <div
                  className="absolute right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  style={{ top: `${Math.max(10, Math.min(chartHeight - 25, getY(player.liquidationPrice)))}px` }}
                >
                  Liq: ${player.liquidationPrice.toFixed(0)}
                </div>
              )}
            </div>

            {/* AI Duel Panel (if AI_DUEL active) */}
            {scenario === 'AI_DUEL' && (
              <div className="mt-3 p-2.5 bg-slate-900/90 rounded-lg border border-sky-500/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-bold">Du:</span>
                  <span className={player.realizedPnL + player.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    ${(player.realizedPnL + player.unrealizedPnL).toFixed(1)}
                  </span>
                </div>
                <div className="text-slate-400 text-[10px] uppercase font-bold">⚔️ VS ⚔️</div>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-bold">Alpha Bot:</span>
                  <span className={ai.realizedPnL + ai.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    ${(ai.realizedPnL + ai.unrealizedPnL).toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-400 italic">({ai.lastDecision})</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Player Dashboard & Actions */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3">
            {/* Live PnL Box */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-colors ${
              player.position === 'NONE'
                ? 'bg-slate-900/80 border-slate-800'
                : isGreen
                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-500/10'
            }`}>
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                {player.position === 'NONE' ? 'Gesamt-Ergebnis' : 'Unrealisierter PnL'}
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span
                  className={`text-3xl font-black font-mono tracking-tight ${
                    player.position === 'NONE'
                      ? totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      : isGreen ? 'text-emerald-400 animate-pulse' : 'text-rose-400'
                  }`}
                >
                  {player.position === 'NONE'
                    ? (totalPnL >= 0 ? `+$${totalPnL.toFixed(2)}` : `-$${Math.abs(totalPnL).toFixed(2)}`)
                    : (player.unrealizedPnL >= 0 ? `+$${player.unrealizedPnL.toFixed(2)}` : `-$${Math.abs(player.unrealizedPnL).toFixed(2)}`)}
                </span>
              </div>

              {/* Combo Streaks */}
              {player.comboMultiplier > 1 && (
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 mt-1 animate-bounce">
                  <Flame className="w-3.5 h-3.5" /> COMBO {player.comboMultiplier.toFixed(1)}x ({player.consecutiveWins} Siege!)
                </div>
              )}
            </div>

            {/* Portfolio Stats */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 text-xs font-mono space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Guthaben (Cash):</span>
                <span className="text-white font-bold">${player.cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Realisierter PnL:</span>
                <span className={player.realizedPnL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {player.realizedPnL >= 0 ? `+$${player.realizedPnL.toFixed(2)}` : `-$${Math.abs(player.realizedPnL).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Win Rate / Trades:</span>
                <span className="text-white font-bold">{winRate}% ({player.winningTrades}/{player.tradesCount})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>High Score:</span>
                <span className="text-amber-400 font-bold">${player.highScore.toFixed(0)}</span>
              </div>
            </div>

            {/* Hebel Selector (1x, 5x, 10x, 25x, 50x) */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3">
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                <span>Degen Hebel:</span>
                <span className="text-emerald-400 font-bold">{player.leverage}x</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 5, 10, 25, 50].map((lev) => (
                  <button
                    key={lev}
                    onClick={() => engine.setLeverage(lev)}
                    disabled={player.position !== 'NONE'}
                    className={`py-1 rounded text-xs font-mono font-bold transition ${
                      player.leverage === lev
                        ? 'bg-emerald-500 text-black shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>

            {/* Order Action Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => engine.openPosition('LONG', 0.5)}
                  disabled={status !== 'PLAYING' || player.isLiquidated}
                  className="py-3 px-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 disabled:opacity-40 text-black font-black font-mono text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition"
                >
                  <TrendingUp className="w-4 h-4" /> BUY / LONG [L]
                </button>
                <button
                  onClick={() => engine.openPosition('SHORT', 0.5)}
                  disabled={status !== 'PLAYING' || player.isLiquidated}
                  className="py-3 px-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-95 disabled:opacity-40 text-white font-black font-mono text-sm rounded-xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 transition"
                >
                  <TrendingDown className="w-4 h-4" /> SELL / SHORT [S]
                </button>
              </div>

              <button
                onClick={() => engine.closePosition()}
                disabled={player.position === 'NONE'}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 text-amber-300 font-bold font-mono text-xs rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 transition"
              >
                <Zap className="w-4 h-4 text-amber-400" /> POSITION SCHLIESSEN [Space]
              </button>
            </div>

            {/* Match Controls (Start / Pause / Reset) */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              {status === 'PLAYING' ? (
                <button
                  onClick={() => engine.pause()}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-400" /> Pause
                </button>
              ) : (
                <button
                  onClick={() => engine.start()}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-black" /> {status === 'PAUSED' ? 'Fortsetzen' : 'Runde starten'}
                </button>
              )}
              <button
                onClick={() => engine.reset()}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700"
                title="Runde zurücksetzen"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Game Over / Liquidated Overlay */}
        {(status === 'GAME_OVER' || player.isLiquidated) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 max-w-md w-full text-center shadow-2xl space-y-4">
              <Award className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
              <div>
                <h3 className="text-2xl font-black text-white font-mono">
                  {player.isLiquidated ? 'LIQUIDIERT! 💥' : 'RUNDE BEENDET! 🏁'}
                </h3>
                <p className={`text-sm font-bold font-mono mt-1 ${getRank().color}`}>
                  Rang: {getRank().label}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2 text-left">
                <div className="flex justify-between text-slate-400">
                  <span>Endkapital:</span>
                  <span className="text-white font-bold">${player.cash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Realisierter PnL:</span>
                  <span className={totalPnL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {totalPnL >= 0 ? `+$${totalPnL.toFixed(2)}` : `-$${Math.abs(totalPnL).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Win Rate:</span>
                  <span className="text-white font-bold">{winRate}% ({player.winningTrades}/{player.tradesCount})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Max Win Streak:</span>
                  <span className="text-amber-400 font-bold">{player.consecutiveWins} Trades</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    engine.reset();
                    engine.start();
                  }}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-mono text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> NOCHMAL SPIELEN
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-mono text-sm rounded-xl border border-slate-700"
                >
                  Beenden
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
