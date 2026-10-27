import { NextResponse } from 'next/server';

import { checkBotApiKey } from '@/lib/bot/auth';
import { formatLocalTime, getReservation } from '@/lib/bot/reservations';

export const dynamic = 'force-dynamic';

interface Params {
  params: { id: string };
}

// Estado de una reserva. n8n lo consulta después del Wait de 15 minutos
// para decidir si avisa al cliente que su reserva expiró.
export async function GET(request: Request, { params }: Params) {
  const unauthorized = checkBotApiKey(request);
  if (unauthorized) return unauthorized;

  const reservation = await getReservation(params.id);

  if (!reservation) {
    return NextResponse.json({ ok: false, message: 'Reserva no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    reservation: {
      id: reservation.id,
      status: reservation.status,
      size: reservation.size,
      quantity: reservation.quantity,
      expiresAt: reservation.expiresAt,
      expiresAtLocal: formatLocalTime(reservation.expiresAt),
      orderId: reservation.orderId,
      product: reservation.product,
    },
  });
}
