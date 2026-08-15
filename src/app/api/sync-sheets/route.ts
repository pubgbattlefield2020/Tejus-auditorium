import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL || process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL is not configured' },
        { status: 400 }
      );
    }

    const payload = await req.json();

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const resultText = await response.text();

    return NextResponse.json({
      success: true,
      googleStatus: response.status,
      result: resultText,
    });
  } catch (err: any) {
    console.error('Error in /api/sync-sheets route:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to sync with Google Sheets' },
      { status: 500 }
    );
  }
}
