import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { ok: false, message: 'Falta "code" en el callback' },
      { status: 400 }
    );
  }

  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  const redirectUri = process.env.MELI_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { ok: false, message: 'Configuración OAuth incompleta' },
      { status: 500 }
    );
  }

  try {
    // Intercambiar código por token
    const response = await axios.post(
      'https://api.mercadolibre.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const tokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || '',
      expires_at: Date.now() / 1000 + parseInt(response.data.expires_in || '21600')
    };

    // Guardar token en archivo (en producción usa una base de datos)
    const tokenPath = path.join(process.cwd(), '.meli_token.json');
    await writeFile(tokenPath, JSON.stringify(tokenData, null, 2));

    console.log('[ML OAuth] Token guardado exitosamente');

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('[ML OAuth] Error:', error.response?.data || error.message);
    return NextResponse.json(
      { ok: false, message: 'Error al obtener token' },
      { status: 500 }
    );
  }
}
