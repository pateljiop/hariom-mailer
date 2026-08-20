import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) return NextResponse.json({ error: `Google authorization failed: ${error}` }, { status: 400 });
  if (!code) return NextResponse.json({ error: 'Missing OAuth authorization code.' }, { status: 400 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Gmail OAuth environment variables are not configured.' }, { status: 500 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('gmail_refresh_token', tokens.refresh_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 180,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to exchange Google authorization code.' }, { status: 500 });
  }
}
