import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { checkBotApiKey } from '@/lib/bot/auth';
import { getAvailable, releaseExpiredReservations } from '@/lib/bot/reservations';

export const dynamic = 'force-dynamic';

// Busca productos por nombre, slug o etiqueta. Devuelve solo lo que el agente necesita.
export async function GET(request: Request) {
  const unauthorized = checkBotApiKey(request);
  if (unauthorized) return unauthorized;

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json(
      { ok: false, message: 'El parámetro q debe tener al menos 2 caracteres' },
      { status: 400 }
    );
  }

  await releaseExpiredReservations();

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q.toLowerCase().replace(/ /g, '_') } },
        { tags: { has: q.toLowerCase() } },
      ],
    },
    take: 5,
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      sizes: true,
      inStock: true,
      reserved: true,
    },
  });

  return NextResponse.json({
    ok: true,
    products: products.map(({ inStock, reserved, ...product }) => ({
      ...product,
      available: getAvailable({ inStock, reserved }),
    })),
  });
}
