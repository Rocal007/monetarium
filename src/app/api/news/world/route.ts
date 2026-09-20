import { NextRequest, NextResponse } from 'next/server';
import { GcpIamNewsClient } from '../../../../lib/news/gcp-iam-client';
import { forexFactoryClient } from '../../../../lib/news/forex-factory-client';
import { MacroSentimentState } from '../../../../lib/types/news';

export const dynamic = 'force-dynamic';

const gcpClient = new GcpIamNewsClient();
let currentCustomCrisis: any = null;

/**
 * GET /api/news/world
 * Holt aggregierte Welt- & Finanznachrichten über Google Cloud IAM oder Forex Factory.
 * Query-Parameter:
 * - ?provider=forexfactory | gcp (Default: gcp)
 * - ?crisis=true (simuliert einen akuten Black-Swan-Schock zur Notbremse-Prüfung)
 * - ?reset=true (hebt eine simulierte Krise wieder auf)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider')?.toLowerCase();
  const triggerCrisis = searchParams.get('crisis') === 'true';
  const resetCrisis = searchParams.get('reset') === 'true';

  if (resetCrisis) {
    currentCustomCrisis = null;
  }

  if (triggerCrisis) {
    currentCustomCrisis = gcpClient.triggerCrisisEvent();
  }

  try {
    let data: MacroSentimentState;

    if (provider === 'forexfactory' || provider === 'forex_factory') {
      const calendar = await forexFactoryClient.fetchCalendar();
      data = forexFactoryClient.convertToMacroSentimentState(calendar);
    } else {
      data = await gcpClient.fetchWorldNews();
    }

    // Falls Krise manuell aktiv geschaltet wurde
    if (currentCustomCrisis) {
      data.articles.unshift(currentCustomCrisis);
      data.crisisActive = true;
      data.crisisReason = currentCustomCrisis.title;
      data.overallSentiment = 'CRISIS';
      data.sentimentScore = -85;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Fehler beim Laden der Weltnachrichten',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news/world
 * Erlaubt das Einspeisen von benutzerdefinierten Eilmeldungen
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Pflichtfeld "title" fehlt' },
        { status: 400 }
      );
    }

    const isCrisis = body.sentiment === 'CRISIS' || body.isCrisis === true;
    currentCustomCrisis = {
      id: `custom-news-${Date.now()}`,
      title: body.title,
      summary: body.summary || 'Manuell eingespeiste Eilmeldung über das Terminal-Interface.',
      source: body.source || 'Benutzer-Eilmeldung',
      timestamp: Date.now(),
      category: body.category || 'MACRO_ECONOMY',
      sentiment: isCrisis ? 'CRISIS' : (body.sentiment || 'NEUTRAL'),
      impactScore: body.impactScore || 90,
      isBreaking: true,
    };

    return NextResponse.json({
      success: true,
      message: 'Nachricht erfolgreich eingespeist',
      article: currentCustomCrisis,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Ungültiges JSON im Request-Body' },
      { status: 400 }
    );
  }
}
