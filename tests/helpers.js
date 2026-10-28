// Utilidades compartidas por las pruebas de la API del bot.
// Requieren el proyecto corriendo (npm run dev) y la base de datos LOCAL.
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Cargar .env sin dependencias extra
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

// Las pruebas modifican datos: nunca correrlas contra producción
const dbUrl = process.env.DATABASE_URL ?? '';
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(dbUrl)) {
  throw new Error('Las pruebas solo se ejecutan contra la base de datos local (DATABASE_URL en localhost)');
}
if (!process.env.BOT_API_KEY) {
  throw new Error('Falta BOT_API_KEY en el archivo .env');
}

const BASE_URL = (process.env.BOT_API_URL ?? 'http://localhost:3000') + '/api/bot';
const HEADERS = { 'content-type': 'application/json', 'x-api-key': process.env.BOT_API_KEY };

// Teléfonos ficticios: todo lo creado con ellos se borra al terminar
const TEST_PHONE_PREFIX = '50500000';
const testPhone = (n) => TEST_PHONE_PREFIX + String(n).padStart(3, '0');

const prisma = new PrismaClient();

const api = async (method, route, body, headers = HEADERS) => {
  const response = await fetch(BASE_URL + route, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
};

// Elige un producto con stock y guarda sus valores para restaurarlos después
const pickProduct = async () => {
  const product = await prisma.product.findFirst({
    where: { inStock: { gt: 0 } },
    orderBy: { title: 'asc' },
  });
  if (!product) throw new Error('No hay productos con stock: ejecute npm run seed');
  return { product, original: { inStock: product.inStock, reserved: product.reserved } };
};

const cleanup = async ({ product, original } = {}) => {
  const conversations = await prisma.conversation.findMany({
    where: { phone: { startsWith: TEST_PHONE_PREFIX } },
    select: { id: true },
  });
  const ids = conversations.map((c) => c.id);
  await prisma.stockReservation.deleteMany({ where: { conversationId: { in: ids } } });
  await prisma.chatMessage.deleteMany({ where: { conversationId: { in: ids } } });
  await prisma.conversation.deleteMany({ where: { id: { in: ids } } });
  if (product) {
    await prisma.product.update({ where: { id: product.id }, data: original });
  }
};

module.exports = { prisma, api, pickProduct, cleanup, testPhone };
