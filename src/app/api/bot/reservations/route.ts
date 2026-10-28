import { NextResponse } from 'next/server';
import { Size } from '@prisma/client';
import { z } from 'zod';

import { checkBotApiKey } from '@/lib/bot/auth';
import { RESERVATION_MINUTES } from '@/lib/bot/config';
import { formatLocalTime, reserveStock } from '@/lib/bot/reservations';

const reservationSchema = z.object({
  phone: z.string().min(6).max(20),
  productId: z.string().uuid(),
  size: z.nativeEnum(Size),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
  // Id del mensaje de WhatsApp con el que el cliente confirmó ("lo quiero")
  idempotencyKey: z.string().min(1).max(255),
});

// Aparta stock por 15 minutos. 201 = reservado, 409 = agotado.
export async function POST(request: Request) {
  const unauthorized = checkBotApiKey(request);
  if (unauthorized) return unauthorized;

  const parsed = reservationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const result = await reserveStock(parsed.data);

  if (!result.ok) {
    switch (result.reason) {
      case 'not_found':
        return NextResponse.json({ ok: false, reason: result.reason, message: 'Producto no encontrado' }, { status: 404 });
      case 'invalid_size':
        return NextResponse.json({ ok: false, reason: result.reason, message: 'Talla no disponible para este producto' }, { status: 422 });
      case 'out_of_stock':
        return NextResponse.json(
          { ok: false, reason: result.reason, message: 'No hay stock suficiente', available: result.available },
          { status: 409 }
        );
    }
  }

  const { reservation, duplicate } = result;

  return NextResponse.json(
    {
      ok: true,
      duplicate,
      reservation: {
        id: reservation.id,
        status: reservation.status,
        productId: reservation.productId,
        size: reservation.size,
        quantity: reservation.quantity,
        expiresAt: reservation.expiresAt,
        // Para el mensaje: "Tienes hasta las 10:18 para pagar o perderás la reserva"
        expiresAtLocal: formatLocalTime(reservation.expiresAt),
        minutes: RESERVATION_MINUTES,
      },
    },
    { status: duplicate ? 200 : 201 }
  );
}
