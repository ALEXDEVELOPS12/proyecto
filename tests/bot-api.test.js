// Pruebas funcionales de la API que consume n8n (src/app/api/bot)
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prisma, api, pickProduct, cleanup, testPhone } = require('./helpers');

describe('API del bot', () => {
  let ctx;

  before(async () => {
    ctx = await pickProduct();
  });

  after(async () => {
    await cleanup(ctx);
    await prisma.$disconnect();
  });

  test('rechaza peticiones sin x-api-key', async () => {
    const r = await api('GET', '/stock?slug=' + ctx.product.slug, null, {});
    assert.equal(r.status, 401);
  });

  test('guarda mensajes y detecta duplicados por waMessageId', async () => {
    const message = {
      phone: testPhone(1),
      text: 'Hola, ¿tienen sudaderas?',
      direction: 'inbound',
      waMessageId: 'wamid.TEST-MSG-1',
    };

    let r = await api('POST', '/messages', message);
    assert.equal(r.status, 200);
    assert.equal(r.body.duplicate, false);
    assert.equal(r.body.history.length, 1);

    r = await api('POST', '/messages', message);
    assert.equal(r.body.duplicate, true);
    assert.equal(r.body.history.length, 1, 'el duplicado no debe guardarse otra vez');

    r = await api('POST', '/messages', { phone: testPhone(1), text: 'Sí, tenemos varias.', direction: 'outbound' });
    assert.equal(r.body.history.length, 2);
    assert.equal(r.body.history[1].direction, 'outbound', 'el historial va en orden cronológico');
  });

  test('busca productos y consulta su disponible', async () => {
    const word = ctx.product.title.split(' ').slice(-1)[0];
    let r = await api('GET', '/products?q=' + encodeURIComponent(word));
    assert.equal(r.status, 200);
    assert.ok(r.body.products.length > 0);

    r = await api('GET', '/stock?slug=' + ctx.product.slug);
    assert.equal(r.status, 200);
    assert.equal(r.body.product.available, ctx.original.inStock - ctx.original.reserved);
  });

  test('reserva, repite el mismo mensaje sin duplicar y libera al vencer', async () => {
    await prisma.product.update({ where: { id: ctx.product.id }, data: { inStock: 5, reserved: 0 } });
    const body = {
      phone: testPhone(2),
      productId: ctx.product.id,
      size: ctx.product.sizes[0],
      quantity: 1,
      idempotencyKey: 'wamid.TEST-RES-1',
    };

    let r = await api('POST', '/reservations', body);
    assert.equal(r.status, 201);
    assert.equal(r.body.reservation.minutes, 15);
    assert.match(r.body.reservation.expiresAtLocal, /\d{2}:\d{2}/);
    const reservationId = r.body.reservation.id;

    r = await api('POST', '/reservations', body);
    assert.equal(r.status, 200);
    assert.equal(r.body.duplicate, true);
    let product = await prisma.product.findUnique({ where: { id: ctx.product.id } });
    assert.equal(product.reserved, 1, 'el mensaje repetido no debe apartar otra unidad');

    // Simular que pasaron 20 minutos sin pagar
    await prisma.stockReservation.update({
      where: { id: reservationId },
      data: { expiresAt: new Date(Date.now() - 20 * 60_000) },
    });
    r = await api('GET', '/reservations/' + reservationId);
    assert.equal(r.body.reservation.status, 'expired');
    product = await prisma.product.findUnique({ where: { id: ctx.product.id } });
    assert.equal(product.reserved, 0, 'la unidad vuelve a estar disponible');
  });

  test('rechaza talla inválida, producto inexistente y datos incompletos', async () => {
    const base = { phone: testPhone(3), productId: ctx.product.id, quantity: 1 };
    const badSize = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].find((s) => !ctx.product.sizes.includes(s));

    if (badSize) {
      const r = await api('POST', '/reservations', { ...base, size: badSize, idempotencyKey: 'wamid.TEST-BAD-1' });
      assert.equal(r.status, 422);
    }

    let r = await api('POST', '/reservations', {
      ...base,
      size: ctx.product.sizes[0],
      productId: '00000000-0000-0000-0000-000000000000',
      idempotencyKey: 'wamid.TEST-BAD-2',
    });
    assert.equal(r.status, 404);

    r = await api('POST', '/reservations', { phone: testPhone(3) });
    assert.equal(r.status, 400);
  });
});
