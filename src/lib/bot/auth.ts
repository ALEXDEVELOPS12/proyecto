import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

// Valida el header x-api-key que envía n8n.
// Devuelve una respuesta de error si no es válido, o null si la petición puede continuar.
export const checkBotApiKey = (request: Request): NextResponse | null => {
  const expected = process.env.BOT_API_KEY;

  if (!expected) {
    console.error('BOT_API_KEY no está configurada');
    return NextResponse.json(
      { ok: false, message: 'API del bot no configurada' },
      { status: 500 }
    );
  }

  const received = request.headers.get('x-api-key') ?? '';
  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json(
      { ok: false, message: 'No autorizado' },
      { status: 401 }
    );
  }

  return null;
};
