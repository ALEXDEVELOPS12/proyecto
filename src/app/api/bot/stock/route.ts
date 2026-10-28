import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { checkBotApiKey } from '@/lib/bot/auth';
import { getAvailable, releaseExpiredReservations } from '@/lib/bot/reservations';

export const dynamic = 'force-dynamic';

// Consulta el disponible de un producto por productId o slug.
// Consultar no aparta nada: solo informa stock - reservado.
export async function GET(request: Request) {
  const unauthorized = checkBotApiKey(request);
  if (unauthorized) return unauthorized;

  const params = new URL(request.url).searchParams;
  const productId = params.get('productId');
  const slug = params.get('slug');

  if (!productId && !slug) {
    return NextResponse.json(
      { ok: false, message: 'Debe enviar productId o slug' },
      { status: 400 }
    );
  }

  await releaseExpiredReservations();

  const product = await prisma.product.findFirst({
    where: productId ? { id: productId } : { slug: slug! },
    select: { id: true, slug: true, title: true, price: true, sizes: true, inStock: true, reserved: true },
  });

  if (!product) {
    return NextResponse.json({ ok: false, message: 'Producto no encontrado' }, { status: 404 });
  }

  const { inStock, reserved, ...rest } = product;

  return NextResponse.json({
    ok: true,
    product: { ...rest, available: getAvailable({ inStock, reserved }) },
  });
}
