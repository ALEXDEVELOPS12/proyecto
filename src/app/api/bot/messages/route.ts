import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { checkBotApiKey } from '@/lib/bot/auth';
import { HISTORY_LIMIT } from '@/lib/bot/config';

const messageSchema = z.object({
  phone: z.string().min(6).max(20),
  text: z.string().min(1).max(4096),
  direction: z.enum(['inbound', 'outbound']),
  waMessageId: z.string().min(1).max(255).optional(),
  customerName: z.string().max(100).optional(),
  intent: z.string().max(50).optional(),
});

// Guarda un mensaje (del cliente o del bot) y devuelve el historial reciente.
// Si el waMessageId ya existe, responde duplicate: true para que n8n no lo procese dos veces.
export async function POST(request: Request) {
  const unauthorized = checkBotApiKey(request);
  if (unauthorized) return unauthorized;

  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { phone, text, direction, waMessageId, customerName, intent } = parsed.data;

  const conversation = await prisma.conversation.upsert({
    where: { phone },
    update: customerName ? { customerName } : {},
    create: { phone, customerName },
  });

  let duplicate = false;
  try {
    await prisma.chatMessage.create({
      data: { conversationId: conversation.id, direction, text, waMessageId, intent },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      duplicate = true;
    } else {
      throw error;
    }
  }

  const recent = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_LIMIT,
    select: { direction: true, text: true, createdAt: true },
  });

  return NextResponse.json({
    ok: true,
    duplicate,
    conversationId: conversation.id,
    conversationStatus: conversation.status,
    history: recent.reverse(),
  });
}
