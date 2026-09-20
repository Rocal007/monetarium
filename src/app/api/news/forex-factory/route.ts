import { NextRequest, NextResponse } from 'next/server';
import { forexFactoryClient } from '../../../../lib/news/forex-factory-client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/news/forex-factory
 * Liefert den aktuellen Forex Factory Wirtschaftskalender der Woche via Fair Economy CDN.
 * Unterstützt Filter:
 * - ?impact=High|Medium|Low
 * - ?country=USD|EUR|GBP...
 * - ?asMacroSentiment=true (gibt direkt das standardisierte MacroSentimentState zurück)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const impactParam = searchParams.get('impact');
    const countryParam = searchParams.get('country');
    const asMacroSentiment = searchParams.get('asMacroSentiment') === 'true';

    let minImpact: 'Low' | 'Medium' | 'High' | undefined = undefined;
    if (impactParam) {
      const imp = impactParam.toLowerCase();
      if (imp.includes('high')) minImpact = 'High';
      else if (imp.includes('med')) minImpact = 'Medium';
      else if (imp.includes('low')) minImpact = 'Low';
    }

    const calendar = await forexFactoryClient.fetchCalendar({
      minImpact,
      country: countryParam || undefined,
    });

    if (asMacroSentiment) {
      const macroState = forexFactoryClient.convertToMacroSentimentState(calendar);
      return NextResponse.json({
        success: true,
        data: macroState,
        rawCalendar: calendar,
      });
    }

    return NextResponse.json({
      success: true,
      data: calendar,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Fehler beim Laden des Forex Factory Kalenders',
      },
      { status: 500 }
    );
  }
}
