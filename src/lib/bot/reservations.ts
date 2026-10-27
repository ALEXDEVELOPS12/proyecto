import { Prisma, Size, StockReservation } from '@prisma/client';
import prisma from '@/lib/prisma';
import {
  BUSINESS_TIMEZONE,
  RESERVATION_GRACE_MINUTES,
  RESERVATION_MINUTES,
} from './config';

type Tx = Prisma.TransactionClient;

interface ReserveInput {
  phone: string;
  productId: string;
  size: Size;
  quantity: number;
  // Id del mensaje de WhatsApp que pidió la reserva
  idempotencyKey: string;
}

export type ReserveResult =
  | { ok: true; reservation: StockReservation; duplicate: boolean }
  | { ok: false; reason: 'not_found' | 'invalid_size' | 'out_of_stock'; available?: number };

// Hora límite en hora de Nicaragua, para el mensaje del bot ("hasta las 10:18 a. m.")
export const formatLocalTime = (date: Date) =>
  new Intl.DateTimeFormat('es-NI', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

// Libera las reservas activas cuyo plazo (más el margen de gracia) ya pasó.
// Se llama antes de consultar o reservar, así no se necesita un cron.
export const releaseExpiredReservations = async (tx: Tx = prisma) => {
  const limit = new Date(Date.now() - RESERVATION_GRACE_MINUTES * 60_000);

  const expired = await tx.stockReservation.findMany({
    where: { status: 'active', expiresAt: { lt: limit } },
    select: { id: true, productId: true, quantity: true },
  });

  for (const reservation of expired) {
    // Solo la petición que logra cambiar el estado devuelve las unidades:
    // si dos peticiones liberan la misma reserva a la vez, la segunda no hace nada
    const { count } = await tx.stockReservation.updateMany({
      where: { id: reservation.id, status: 'active' },
      data: { status: 'expired' },
    });

    if (count === 1) {
      await tx.product.update({
        where: { id: reservation.productId },
        data: { reserved: { decrement: reservation.quantity } },
      });
    }
  }

  return expired.length;
};

// Disponible real = stock - unidades reservadas
export const getAvailable = (product: { inStock: number; reserved: number }) =>
  Math.max(product.inStock - product.reserved, 0);

// Reserva atómica: si dos clientes piden la última unidad al mismo tiempo,
// PostgreSQL bloquea la fila del producto durante el UPDATE y ejecuta las peticiones
// una tras otra. La primera cumple la condición y gana; la segunda afecta 0 filas.
export const reserveStock = async (input: ReserveInput): Promise<ReserveResult> => {
  const existing = await prisma.stockReservation.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return { ok: true, reservation: existing, duplicate: true };

  try {
    return await prisma.$transaction(async (tx) => {
      await releaseExpiredReservations(tx);

      const product = await tx.product.findUnique({
        where: { id: input.productId },
        select: { id: true, sizes: true },
      });

      if (!product) return { ok: false, reason: 'not_found' } as const;
      if (!product.sizes.includes(input.size)) {
        return { ok: false, reason: 'invalid_size' } as const;
      }

      const updated = await tx.$executeRaw`
        UPDATE "Product"
        SET "reserved" = "reserved" + ${input.quantity}
        WHERE "id" = ${input.productId}
          AND "inStock" - "reserved" >= ${input.quantity}
      `;

      if (updated === 0) {
        const current = await tx.product.findUniqueOrThrow({
          where: { id: input.productId },
          select: { inStock: true, reserved: true },
        });
        return { ok: false, reason: 'out_of_stock', available: getAvailable(current) } as const;
      }

      const conversation = await tx.conversation.upsert({
        where: { phone: input.phone },
        update: {},
        create: { phone: input.phone },
      });

      const reservation = await tx.stockReservation.create({
        data: {
          productId: input.productId,
          size: input.size,
          quantity: input.quantity,
          idempotencyKey: input.idempotencyKey,
          conversationId: conversation.id,
          expiresAt: new Date(Date.now() + RESERVATION_MINUTES * 60_000),
        },
      });

      return { ok: true, reservation, duplicate: false } as const;
    });
  } catch (error) {
    // Dos peticiones con la misma clave al mismo tiempo: la segunda choca con el
    // índice único, su transacción se revierte (incluido el UPDATE) y se devuelve la primera
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const reservation = await prisma.stockReservation.findUniqueOrThrow({
        where: { idempotencyKey: input.idempotencyKey },
      });
      return { ok: true, reservation, duplicate: true };
    }
    throw error;
  }
};

// Estado de una reserva; si ya venció, se libera en ese momento
export const getReservation = async (id: string) => {
  await releaseExpiredReservations();
  return prisma.stockReservation.findUnique({
    where: { id },
    include: { product: { select: { title: true, price: true, slug: true } } },
  });
};
