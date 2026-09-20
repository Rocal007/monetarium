export type ArcadeScenarioType =
  | 'BULL_RUN'
  | 'FLASH_CRASH'
  | 'WHALE_WHIPLASH'
  | 'AI_DUEL'
  | 'BAR_BY_BAR';

export type ArcadePositionType = 'NONE' | 'LONG' | 'SHORT';

export interface ArcadeMarketEvent {
  id: string;
  timestamp: number;
  headline: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'VOLATILITY';
  priceImpactPct: number;
}

export interface ArcadeCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ArcadePlayerState {
  cash: number;
  initialCash: number;
  leverage: number;
  position: ArcadePositionType;
  entryPrice: number;
  positionSize: number; // in Base Currency (z.B. BTC)
  marginUsed: number;
  liquidationPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  tradesCount: number;
  winningTrades: number;
  consecutiveWins: number;
  comboMultiplier: number;
  highScore: number;
  isLiquidated: boolean;
}

export interface ArcadeAIState {
  cash: number;
  position: ArcadePositionType;
  entryPrice: number;
  positionSize: number;
  unrealizedPnL: number;
  realizedPnL: number;
  lastDecision: string;
}

export interface ArcadeGameState {
  scenario: ArcadeScenarioType;
  status: 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
  speedMultiplier: number; // 1, 2, 5, 10, 20
  currentPrice: number;
  candles: ArcadeCandle[];
  activeEvents: ArcadeMarketEvent[];
  player: ArcadePlayerState;
  ai: ArcadeAIState;
  timeRemainingSec: number;
  totalRoundTimeSec: number;
}

// -------------------------------------------------------------
// Web Audio Synthesizer (100% autark, ohne externe MP3-Assets)
// -------------------------------------------------------------
class ArcadeSoundSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public play(type: 'buy' | 'sell' | 'win' | 'loss' | 'liquidation' | 'shock' | 'combo') {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case 'buy': {
          // Zweiklang aufsteigend (fröhliches Kaching)
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }
        case 'sell': {
          // Zweiklang absteigend (Kassen-Drop)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, now); // E5
          osc.frequency.exponentialRampToValueAtTime(440.0, now + 0.12); // A4
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }
        case 'win': {
          // Retro Victory Arpeggio (C5 -> E5 -> G5 -> C6)
          osc.type = 'square';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.06);
          osc.frequency.setValueAtTime(783.99, now + 0.12);
          osc.frequency.setValueAtTime(1046.5, now + 0.18);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          osc.start(now);
          osc.stop(now + 0.32);
          break;
        }
        case 'loss': {
          // Dumpfer Bass-Drop
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case 'liquidation': {
          // Sirenen-Alarm
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(800, now + 0.15);
          osc.frequency.linearRampToValueAtTime(250, now + 0.3);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        }
        case 'shock': {
          // Dramatischer Tremolo-Impuls
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case 'combo': {
          // Glissando Hochfrequenz
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }
      }
    } catch {
      // AudioContext Fehler stumm abfangen
    }
  }
}

// -------------------------------------------------------------
// Hauptklasse ArcadeEngine
// -------------------------------------------------------------
export class ArcadeEngine {
  private state: ArcadeGameState;
  private timer: NodeJS.Timeout | null = null;
  private soundSynth: ArcadeSoundSynth = new ArcadeSoundSynth();
  private subscribers: Array<(state: ArcadeGameState) => void> = [];

  constructor() {
    this.state = this.createInitialState('BULL_RUN');
  }

  private createInitialState(scenario: ArcadeScenarioType): ArcadeGameState {
    const basePrice = scenario === 'FLASH_CRASH' ? 72000 : scenario === 'BULL_RUN' ? 58000 : 64000;
    const initialCandles = this.generatePreHistory(basePrice, 30);

    return {
      scenario,
      status: 'IDLE',
      speedMultiplier: 2,
      currentPrice: basePrice,
      candles: initialCandles,
      activeEvents: [],
      player: {
        cash: 10000,
        initialCash: 10000,
        leverage: 10,
        position: 'NONE',
        entryPrice: 0,
        positionSize: 0,
        marginUsed: 0,
        liquidationPrice: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        tradesCount: 0,
        winningTrades: 0,
        consecutiveWins: 0,
        comboMultiplier: 1.0,
        highScore: 10000,
        isLiquidated: false,
      },
      ai: {
        cash: 10000,
        position: 'NONE',
        entryPrice: 0,
        positionSize: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        lastDecision: 'Wartet auf Marktbewegung',
      },
      timeRemainingSec: 90,
      totalRoundTimeSec: 90,
    };
  }

  private generatePreHistory(startPrice: number, count: number): ArcadeCandle[] {
    const candles: ArcadeCandle[] = [];
    let p = startPrice * 0.95;
    const now = Date.now() - count * 60000;

    for (let i = 0; i < count; i++) {
      const delta = (Math.random() - 0.49) * 0.008;
      const open = p;
      const close = p * (1 + delta);
      const high = Math.max(open, close) * (1 + Math.random() * 0.003);
      const low = Math.min(open, close) * (1 - Math.random() * 0.003);
      candles.push({
        timestamp: now + i * 60000,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(50 + Math.random() * 200),
      });
      p = close;
    }
    return candles;
  }

  public subscribe(cb: (state: ArcadeGameState) => void): () => void {
    this.subscribers.push(cb);
    cb(this.state);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private emit() {
    this.subscribers.forEach((cb) => cb(this.state));
  }

  public getState(): ArcadeGameState {
    return this.state;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundSynth.enabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundSynth.enabled;
  }

  public setScenario(scenario: ArcadeScenarioType) {
    this.stop();
    this.state = this.createInitialState(scenario);
    this.emit();
  }

  public setSpeed(speed: number) {
    this.state.speedMultiplier = speed;
    if (this.state.status === 'PLAYING') {
      this.restartTimer();
    }
    this.emit();
  }

  public setLeverage(leverage: number) {
    if (this.state.player.position !== 'NONE') return;
    this.state.player.leverage = Math.max(1, Math.min(50, leverage));
    this.emit();
  }

  public start() {
    if (this.state.status === 'PLAYING') return;
    this.state.status = 'PLAYING';
    this.state.player.isLiquidated = false;
    this.restartTimer();
    this.soundSynth.play('win');
    this.emit();
  }

  public pause() {
    if (this.state.status !== 'PLAYING') return;
    this.state.status = 'PAUSED';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit();
  }

  public stop() {
    this.state.status = 'IDLE';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit();
  }

  public reset() {
    this.stop();
    this.state = this.createInitialState(this.state.scenario);
    this.emit();
  }

  private restartTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    const intervalMs = Math.max(50, Math.floor(1000 / this.state.speedMultiplier));
    this.timer = setInterval(() => {
      this.processTick();
    }, intervalMs);
  }

  // -------------------------------------------------------------
  // Order Execution & Trading Actions
  // -------------------------------------------------------------
  public openPosition(side: 'LONG' | 'SHORT', allocationPct: number = 0.5) {
    if (this.state.status !== 'PLAYING' || this.state.player.isLiquidated) return;

    if (this.state.player.position !== 'NONE' && this.state.player.position !== side) {
      this.closePosition();
    }

    const { player, currentPrice } = this.state;
    const margin = (player.cash * allocationPct);
    if (margin < 10) return;

    const notionalValue = margin * player.leverage;
    const size = notionalValue / currentPrice;

    player.position = side;
    player.entryPrice = currentPrice;
    player.positionSize = size;
    player.marginUsed = margin;
    player.tradesCount += 1;

    const liqDeltaPct = 0.9 / player.leverage;
    if (side === 'LONG') {
      player.liquidationPrice = currentPrice * (1 - liqDeltaPct);
    } else {
      player.liquidationPrice = currentPrice * (1 + liqDeltaPct);
    }

    this.soundSynth.play(side === 'LONG' ? 'buy' : 'sell');
    this.emit();
  }

  public closePosition() {
    const { player } = this.state;
    if (player.position === 'NONE') return;

    const pnl = player.unrealizedPnL;
    player.realizedPnL += pnl;
    player.cash = Math.max(0, player.cash + pnl);

    if (pnl > 0) {
      player.winningTrades += 1;
      player.consecutiveWins += 1;
      player.comboMultiplier = Math.min(3.0, 1.0 + player.consecutiveWins * 0.2);
      this.soundSynth.play(player.consecutiveWins >= 3 ? 'combo' : 'win');
    } else {
      player.consecutiveWins = 0;
      player.comboMultiplier = 1.0;
      this.soundSynth.play('loss');
    }

    const totalScore = player.cash + player.realizedPnL;
    if (totalScore > player.highScore) {
      player.highScore = totalScore;
    }

    player.position = 'NONE';
    player.entryPrice = 0;
    player.positionSize = 0;
    player.marginUsed = 0;
    player.liquidationPrice = 0;
    player.unrealizedPnL = 0;

    this.emit();
  }

  public stepNextBar() {
    if (this.state.scenario !== 'BAR_BY_BAR') return;
    this.processTick();
  }

  // -------------------------------------------------------------
  // Tick-Generierung & Markt-Physik
  // -------------------------------------------------------------
  private processTick() {
    if (this.state.status !== 'PLAYING') return;

    if (this.state.scenario !== 'BAR_BY_BAR') {
      this.state.timeRemainingSec -= 0.5 * (this.state.speedMultiplier / 2);
      if (this.state.timeRemainingSec <= 0) {
        this.finishRound();
        return;
      }
    }

    let drift = 0;
    let vol = 0.005;

    switch (this.state.scenario) {
      case 'BULL_RUN':
        drift = 0.0022;
        vol = 0.006;
        break;
      case 'FLASH_CRASH':
        drift = -0.0035;
        vol = 0.012;
        break;
      case 'WHALE_WHIPLASH':
        drift = Math.sin(Date.now() / 3000) * 0.004;
        vol = 0.009;
        break;
      case 'AI_DUEL':
      case 'BAR_BY_BAR':
        drift = 0.0003;
        vol = 0.005;
        break;
    }

    let eventImpact = 0;
    if (Math.random() < 0.04 && this.state.activeEvents.length < 3) {
      const shock = this.triggerRandomShock();
      eventImpact = shock.priceImpactPct;
    }

    const randomJitter = (Math.random() - 0.49) * vol;
    const totalDeltaPct = drift + randomJitter + eventImpact;

    const oldPrice = this.state.currentPrice;
    const newPrice = Number((oldPrice * (1 + totalDeltaPct)).toFixed(2));
    this.state.currentPrice = newPrice;

    const candles = this.state.candles;
    const lastCandle = candles[candles.length - 1];

    if (candles.length > 0 && Math.random() > 0.15) {
      lastCandle.close = newPrice;
      lastCandle.high = Math.max(lastCandle.high, newPrice);
      lastCandle.low = Math.min(lastCandle.low, newPrice);
      lastCandle.volume += Math.floor(10 + Math.random() * 40);
    } else {
      const newCandle: ArcadeCandle = {
        timestamp: Date.now(),
        open: oldPrice,
        high: Math.max(oldPrice, newPrice),
        low: Math.min(oldPrice, newPrice),
        close: newPrice,
        volume: Math.floor(50 + Math.random() * 100),
      };
      if (candles.length > 60) candles.shift();
      candles.push(newCandle);
    }

    this.updatePlayerState(newPrice);
    this.updateAIState(newPrice);
    this.emit();
  }

  private updatePlayerState(newPrice: number) {
    const { player } = this.state;
    if (player.position === 'NONE' || player.isLiquidated) return;

    const priceDiff = newPrice - player.entryPrice;
    const rawPnL = player.position === 'LONG'
      ? priceDiff * player.positionSize
      : -priceDiff * player.positionSize;

    player.unrealizedPnL = Number((rawPnL * player.comboMultiplier).toFixed(2));

    const isLiq = player.position === 'LONG'
      ? newPrice <= player.liquidationPrice
      : newPrice >= player.liquidationPrice;

    if (isLiq) {
      player.isLiquidated = true;
      player.cash = Math.max(0, player.cash - player.marginUsed);
      player.realizedPnL -= player.marginUsed;
      player.position = 'NONE';
      player.unrealizedPnL = 0;
      player.consecutiveWins = 0;
      player.comboMultiplier = 1.0;
      this.soundSynth.play('liquidation');
    }
  }

  private updateAIState(newPrice: number) {
    const { ai, candles, scenario } = this.state;
    if (scenario !== 'AI_DUEL') return;

    if (candles.length >= 5) {
      const recent = candles.slice(-5);
      const isUptrend = recent[recent.length - 1].close > recent[0].close;

      if (ai.position === 'NONE') {
        if (isUptrend && Math.random() > 0.4) {
          ai.position = 'LONG';
          ai.entryPrice = newPrice;
          ai.positionSize = (ai.cash * 0.4 * 5) / newPrice;
          ai.lastDecision = 'KI eröffnet LONG (Momentum-Folge)';
        } else if (!isUptrend && Math.random() > 0.4) {
          ai.position = 'SHORT';
          ai.entryPrice = newPrice;
          ai.positionSize = (ai.cash * 0.4 * 5) / newPrice;
          ai.lastDecision = 'KI eröffnet SHORT (Mean Reversion)';
        }
      } else {
        const diff = newPrice - ai.entryPrice;
        const pnl = ai.position === 'LONG' ? diff * ai.positionSize : -diff * ai.positionSize;
        ai.unrealizedPnL = Number(pnl.toFixed(2));

        if (Math.abs(pnl) > ai.cash * 0.05 || Math.random() < 0.1) {
          ai.realizedPnL += pnl;
          ai.cash = Math.max(0, ai.cash + pnl);
          ai.position = 'NONE';
          ai.unrealizedPnL = 0;
          ai.lastDecision = pnl > 0 ? `KI schließt mit Gewinn (+\$${pnl.toFixed(0)})` : `KI schließt Stop-Loss (-\$${Math.abs(pnl).toFixed(0)})`;
        }
      }
    }
  }

  private triggerRandomShock(): ArcadeMarketEvent {
    const shocks: Array<{ headline: string; sentiment: 'BULLISH' | 'BEARISH' | 'VOLATILITY'; impact: number }> = [
      { headline: '🚨 WHALE ALERT: 15.000 BTC an Spot-Börse transferiert!', sentiment: 'BEARISH', impact: -0.025 },
      { headline: '🏛️ FED NOTFALL-ZINSSENKUNG: -50 Basispunkte angekündigt!', sentiment: 'BULLISH', impact: 0.035 },
      { headline: '⚡ FLASH LIQUIDATION: 200 Mio. \$ Short-Kaskade ausgelöst!', sentiment: 'BULLISH', impact: 0.04 },
      { headline: '⚠️ SEC UNTERSUCHUNG: Großbörse mit Trading-Stopp belegt!', sentiment: 'BEARISH', impact: -0.045 },
      { headline: '💎 ELON TWEET: "Money is just code" – Krypto-Rallye explodiert!', sentiment: 'BULLISH', impact: 0.03 },
      { headline: '📉 BLACK SWAN: Asiatischer Leitindex bricht um 8% ein!', sentiment: 'BEARISH', impact: -0.038 },
      { headline: '📊 INFLATIONSDATEN (CPI) 0.5% unter Prognose – Risk-On Rallye!', sentiment: 'BULLISH', impact: 0.022 },
    ];

    const pick = shocks[Math.floor(Math.random() * shocks.length)];
    const event: ArcadeMarketEvent = {
      id: `shock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      headline: pick.headline,
      sentiment: pick.sentiment,
      priceImpactPct: pick.impact,
    };

    this.state.activeEvents.unshift(event);
    if (this.state.activeEvents.length > 4) {
      this.state.activeEvents.pop();
    }

    this.soundSynth.play('shock');
    return event;
  }

  private finishRound() {
    this.closePosition();
    this.state.status = 'GAME_OVER';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.soundSynth.play(this.state.player.cash >= this.state.player.initialCash ? 'win' : 'loss');
    this.emit();
  }
}
