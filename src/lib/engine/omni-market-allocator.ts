import { VirtualExchange } from './virtual-exchange';
import { PortfolioManager } from './portfolio-manager';
import { OrderSide, OrderType, TradeLog } from '../types/trading';
import { POPULAR_GLOBAL_ASSETS } from '../data/global-market-feed';
import { SECTOR_FLEET } from '../agents/sectors/sector-fleet';

export interface OmniMarketItem {
  symbol: string;
  name: string;
  category: 'EQUITY' | 'INDEX' | 'COMMODITY' | 'CRYPTO';
  sector?: string;
  weightPercent: number;
  allocatedEur: number;
  amount: number;
  price: number;
  rationale: string;
  estimatedFee: number;
  estimatedSlippage: number;
}

export interface OmniMarketPlan {
  totalBudget: number;
  availableCash: number;
  cashReserve: number;
  items: OmniMarketItem[];
  totalAllocated: number;
  totalFees: number;
  totalSlippage: number;
  timestamp: number;
  summary: string;
}

export interface OmniMarketExecutionResult {
  success: boolean;
  totalInvested: number;
  totalFees: number;
  executedOrders: {
    symbol: string;
    orderId: string;
    amount: number;
    price: number;
    totalCost: number;
    fee: number;
    status: 'FILLED' | 'REJECTED';
    tradeLog?: TradeLog;
  }[];
  portfolioCashRemaining: number;
  portfolioEquity: number;
  positionsCount: number;
  timestamp: number;
}

/**
 * 19 institutionell ausgewählte Kern-Assets über alle Weltmärkte & die 5 Sektor-Flotten
 */
export const OMNI_MARKET_ALLOCATION_WEIGHTS = [
  // --- GESAMTBÖRSENMARKT: LEIT-INDIZES & ROHSTOFFE (40%) ---
  { symbol: 'SPY', weight: 15, category: 'INDEX' as const, sector: 'US_EQUITY', rationale: 'Globaler Leit-ETF für 500 führende US-Unternehmen (Makro-Kernanker)' },
  { symbol: 'QQQ', weight: 12, category: 'INDEX' as const, sector: 'TECH_INDEX', rationale: 'Nasdaq 100 Megacap Tech & Wachstums-Motor' },
  { symbol: 'GLD', weight: 8, category: 'COMMODITY' as const, sector: 'COMMODITIES', rationale: 'Physisch hinterlegter Gold-Anker zur Inflations- & Krisenabsicherung' },
  { symbol: 'USO', weight: 5, category: 'COMMODITY' as const, sector: 'COMMODITIES', rationale: 'Rohöl WTI Energie-Basis & Geopolitik-Hedge' },

  // --- SEKTOR 1: KRYPTO SENTINEL (12%) ---
  { symbol: 'BTC/USDT', weight: 6, category: 'CRYPTO' as const, sector: 'CRYPTO', rationale: 'Digitales Gold & unangefochtener Krypto-Leitwert mit ETF-Zuflüssen' },
  { symbol: 'ETH/USDT', weight: 4, category: 'CRYPTO' as const, sector: 'CRYPTO', rationale: 'Dezentrales Settlement-Netzwerk & Smart Contract Layer-1' },
  { symbol: 'SOL/USDT', weight: 2, category: 'CRYPTO' as const, sector: 'CRYPTO', rationale: 'High-Throughput L1 mit höchster Retail- & DeFi-Aktivität' },

  // --- SEKTOR 2: RÜSTUNG & GEOPOLITIK (12%) ---
  { symbol: 'RHM.DE', weight: 5, category: 'EQUITY' as const, sector: 'DEFENSE', rationale: 'Europäischer Rüstungschampion & Munitions-Monopolist' },
  { symbol: 'LMT', weight: 4, category: 'EQUITY' as const, sector: 'DEFENSE', rationale: 'US Aerospace & Verteidigungs-Systemhaus (F-35, Patriot)' },
  { symbol: 'PLTR', weight: 3, category: 'EQUITY' as const, sector: 'DEFENSE', rationale: 'KI- und Big-Data-Betriebssystem für westliche Streitkräfte & Nachrichtendienste' },

  // --- SEKTOR 3: KI & HALBLEITER (14%) ---
  { symbol: 'NVDA', weight: 5, category: 'EQUITY' as const, sector: 'AI_COMPUTE', rationale: 'Weltmarktführer bei KI-Beschleunigern, CUDA-Ökosystem & H100/Blackwell' },
  { symbol: 'MSFT', weight: 4, category: 'EQUITY' as const, sector: 'AI_COMPUTE', rationale: 'Hyperscale Cloud-Infrastruktur & OpenAI-Kommerzialisierung' },
  { symbol: 'TSM', weight: 3, category: 'EQUITY' as const, sector: 'AI_COMPUTE', rationale: 'Unverzichtbare Foundry für 90%+ aller weltweiten Spitzenchips' },
  { symbol: 'AMD', weight: 2, category: 'EQUITY' as const, sector: 'AI_COMPUTE', rationale: 'Strategischer Herausforderer im Server- & KI-Compute-Markt' },

  // --- SEKTOR 4: AUTOMOBIL & MOBILITY (10%) ---
  { symbol: 'TSLA', weight: 4, category: 'EQUITY' as const, sector: 'AUTOMOTIVE', rationale: 'Pionier für Elektrofahrzeuge, Full Self-Driving & autonomes Ladenetz' },
  { symbol: 'BYD', weight: 3, category: 'EQUITY' as const, sector: 'AUTOMOTIVE', rationale: 'Weltweit volumenstärkster Batterie- & E-Mobilitäts-Hersteller' },
  { symbol: 'BMW.DE', weight: 3, category: 'EQUITY' as const, sector: 'AUTOMOTIVE', rationale: 'Europäische Premium-Mobilität mit hoher Cashflow-Disziplin' },

  // --- SEKTOR 5: HUMANOID ROBOTICS (12%) ---
  { symbol: 'ISRG', weight: 5, category: 'EQUITY' as const, sector: 'HUMANOID_ROBOTS', rationale: 'Weltweiter Monopolist für roboterassistierte Chirurgie (da Vinci)' },
  { symbol: 'ABB', weight: 4, category: 'EQUITY' as const, sector: 'HUMANOID_ROBOTS', rationale: 'Globaler Marktführer in Industrieautomation & Robotik-Armen' },
  { symbol: 'FANUY', weight: 3, category: 'EQUITY' as const, sector: 'HUMANOID_ROBOTS', rationale: 'Japanischer Präzisions-Roboter- und CNC-Pionier für Fabrikstraßen' },
];

/**
 * Erstellt einen vollumfänglichen Omni-Market Allokationsplan
 */
export function generateOmniMarketPlan(params: {
  availableCash: number;
  targetBudgetPercent?: number; // Standard 80% (20% Cash-Puffer)
  customBudget?: number;
  marketPriceOverrides?: Record<string, number>;
}): OmniMarketPlan {
  const { availableCash, targetBudgetPercent = 80, customBudget, marketPriceOverrides = {} } = params;

  const effectiveBudget = customBudget !== undefined && customBudget > 0
    ? Math.min(availableCash, customBudget)
    : Math.floor((availableCash * targetBudgetPercent) / 100);

  const cashReserve = availableCash - effectiveBudget;

  let totalAllocated = 0;
  let totalFees = 0;
  let totalSlippage = 0;

  const items: OmniMarketItem[] = OMNI_MARKET_ALLOCATION_WEIGHTS.map((spec) => {
    // Finde Basispreis aus POPULAR_GLOBAL_ASSETS oder SECTOR_FLEET
    let resolvedPrice = marketPriceOverrides[spec.symbol];
    let resolvedName = spec.symbol;

    if (!resolvedPrice) {
      const pop = POPULAR_GLOBAL_ASSETS[spec.symbol];
      if (pop) {
        resolvedPrice = pop.basePrice;
        resolvedName = pop.name;
      } else {
        const fleetAsset = Object.values(SECTOR_FLEET)
          .flatMap((s) => s.universe)
          .find((u) => u.symbol === spec.symbol);
        if (fleetAsset) {
          resolvedPrice = fleetAsset.basePrice;
          resolvedName = fleetAsset.name;
        }
      }
    }

    const price = resolvedPrice || 100.0;
    const allocatedEur = Number(((effectiveBudget * spec.weight) / 100).toFixed(2));
    const isCrypto = spec.category === 'CRYPTO';
    const amount = Number((allocatedEur / price).toFixed(isCrypto && price > 1000 ? 6 : isCrypto ? 4 : 2));

    const estimatedFee = Number((allocatedEur * 0.001).toFixed(2));
    const estimatedSlippage = Number((allocatedEur * 0.0005).toFixed(2));

    totalAllocated += allocatedEur;
    totalFees += estimatedFee;
    totalSlippage += estimatedSlippage;

    return {
      symbol: spec.symbol,
      name: resolvedName,
      category: spec.category,
      sector: spec.sector,
      weightPercent: spec.weight,
      allocatedEur,
      amount,
      price,
      rationale: spec.rationale,
      estimatedFee,
      estimatedSlippage,
    };
  });

  return {
    totalBudget: effectiveBudget,
    availableCash,
    cashReserve,
    items,
    totalAllocated: Number(totalAllocated.toFixed(2)),
    totalFees: Number(totalFees.toFixed(2)),
    totalSlippage: Number(totalSlippage.toFixed(2)),
    timestamp: Date.now(),
    summary: `Omni-Market Allokation: ${items.length} Positionen über 5 Sektoren und globale Leitindizes (Budget: ${effectiveBudget.toLocaleString('de-DE')} €).`,
  };
}

/**
 * Führt die Investition in alle Märkte und alle 5 Sektoren der Sektor-Flotte atomar aus
 */
export function executeOmniMarketBasket(
  plan: OmniMarketPlan,
  virtualExchange: VirtualExchange
): OmniMarketExecutionResult {
  const executedOrders: OmniMarketExecutionResult['executedOrders'] = [];
  let totalInvested = 0;
  let totalFees = 0;

  for (const item of plan.items) {
    try {
      const { order, trade } = virtualExchange.submitOrder({
        symbol: item.symbol,
        side: 'BUY',
        type: 'MARKET',
        amount: item.amount,
        currentMarketPrice: item.price,
      });

      const actualCost = (order.filledPrice ?? item.price) * item.amount;
      totalInvested += actualCost;
      totalFees += order.fee;

      executedOrders.push({
        symbol: item.symbol,
        orderId: order.id,
        amount: item.amount,
        price: order.filledPrice ?? item.price,
        totalCost: Number(actualCost.toFixed(2)),
        fee: order.fee,
        status: order.status === 'FILLED' ? 'FILLED' : 'REJECTED',
        tradeLog: trade,
      });
    } catch (err: any) {
      console.warn(`[Omni-Market] Fehler bei Order für ${item.symbol}:`, err?.message);
      executedOrders.push({
        symbol: item.symbol,
        orderId: `err-${Date.now()}`,
        amount: item.amount,
        price: item.price,
        totalCost: 0,
        fee: 0,
        status: 'REJECTED',
      });
    }
  }

  return {
    success: executedOrders.every((o) => o.status === 'FILLED'),
    totalInvested: Number(totalInvested.toFixed(2)),
    totalFees: Number(totalFees.toFixed(2)),
    executedOrders,
    portfolioCashRemaining: 0, // vom Aufrufer aktualisiert
    portfolioEquity: 0,
    positionsCount: executedOrders.filter((o) => o.status === 'FILLED').length,
    timestamp: Date.now(),
  };
}
