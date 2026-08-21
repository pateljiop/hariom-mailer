import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

type Lead = { to?: string; subject?: string; text?: string };
type SendResult = { to: string; ok: boolean; id?: string; error?: string };

function getErrorMessage(error: unknown) {
  const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string } | null;
  return err?.response?.data?.error?.message || err?.message || 'Gmail rejected this message.';
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('gmail_refresh_token')?.value;
  if (!refreshToken) return NextResponse.json({ error: 'Connect Gmail first.' }, { status: 401 });

  const body = await request.json().catch(() => null) as { leads?: Lead[]; confirm?: boolean } | null;
  if (!body?.confirm) return NextResponse.json({ error: 'Confirm that the reviewed leads are relevant before sending.' }, { status: 400 });

  const leads = Array.isArray(body.leads) ? body.leads.slice(0, 10) : [];
  if (!leads.length) return NextResponse.json({ error: 'Add at least one lead.' }, { status: 400 });
  if (body.leads && body.leads.length > 10) return NextResponse.json({ error: 'Batch limit is 10 emails per run.' }, { status: 400 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return NextResponse.json({ error: 'Gmail OAuth environment variables are not configured.' }, { status: 500 });

  const valid = leads.every(lead => {
    const to = lead.to?.trim() || '';
    const subject = lead.subject?.trim() || '';
    const text = lead.text?.trim() || '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) && !!subject && !!text && !text.includes('{{') && !text.includes('}}');
  });
  if (!valid) return NextResponse.json({ error: 'Every lead needs a valid email, subject and finalized message. Unresolved placeholders are blocked.' }, { status: 400 });

  try {
    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    auth.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: 'v1', auth });
    const results: SendResult[] = [];

    for (const lead of leads) {
      const to = lead.to!.trim();
      const subject = lead.subject!.trim();
      const text = lead.text!.trim();
      try {
        const raw = [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset="UTF-8"', '', text].join('\r\n');
        const response = await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encodeBase64Url(raw) } });
        results.push({ to, ok: true, id: response.data.id || undefined });
      } catch (error) {
        const message = getErrorMessage(error);
        console.error('Gmail batch send failed', { to, message });
        results.push({ to, ok: false, error: message });
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return NextResponse.json({
      ok: results.some(r => r.ok),
      sent: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Gmail batch setup failed', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
