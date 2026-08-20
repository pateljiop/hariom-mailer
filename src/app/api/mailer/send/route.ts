import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('gmail_refresh_token')?.value;
  if (!refreshToken) return NextResponse.json({ error: 'Connect Gmail first.' }, { status: 401 });

  const body = await request.json().catch(() => null) as { to?: string; subject?: string; text?: string } | null;
  const to = body?.to?.trim();
  const subject = body?.subject?.trim();
  const text = body?.text?.trim();
  if (!to || !subject || !text) return NextResponse.json({ error: 'Recipient, subject and message are required.' }, { status: 400 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return NextResponse.json({ error: 'Gmail OAuth environment variables are not configured.' }, { status: 500 });

  try {
    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    auth.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: 'v1', auth });
    const raw = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      text,
    ].join('\r\n');
    const response = await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encodeBase64Url(raw) } });
    return NextResponse.json({ ok: true, id: response.data.id });
  } catch {
    return NextResponse.json({ error: 'Gmail rejected the message. Reconnect Gmail and try again.' }, { status: 502 });
  }
}
