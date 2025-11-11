import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[ML] Notificación recibida:', body);
    
    // Aquí puedes procesar notificaciones de cambios en órdenes, mensajes, etc.
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[ML] Error procesando notificación:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
