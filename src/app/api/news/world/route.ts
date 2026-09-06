import { NextRequest, NextResponse } from 'next/server';
import { GcpIamNewsClient } from '../../../../lib/news/gcp-iam-client';
import { MacroSentimentState } from '../../../../lib/types/news';

export const dynamic = 'force-dynamic';

const gcpClient = new GcpIamNewsClient();
let currentCustomCrisis: any = null;

/**
 * GET /api/news/world
 * Holt aggregierte Welt- & Finanznachrichten über den Google Cloud IAM Client.
 * Optional: ?crisis=true simuliert einen akuten Black-Swan-Schock zur Überprüfung der Notbremse.
 * Optional: ?reset=true hebt eine simulierte Krise wieder auf.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const triggerCrisis = searchParams.get('crisis') === 'true';
  const resetCrisis = searchParams.get('reset') === 'true';

  if (resetCrisis) {
    currentCustomCrisis = null;
  }

  if (triggerCrisis) {
    currentCustomCrisis = gcpClient.triggerCrisisEvent();
  }

  try {
    const data: MacroSentimentState = await gcpClient.fetchWorldNews();

    // Falls Krise aktiv geschaltet wurde
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
        error: err.message || 'Fehler beim Laden der Weltnachrichten via Google Cloud IAM',
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
