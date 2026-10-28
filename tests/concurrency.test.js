// Respuesta a la pregunta del profesor:
// "¿Qué pasa si dos personas escriben al mismo tiempo y solo hay un producto en stock?"
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prisma, api, pickProduct, cleanup, testPhone } = require('./helpers');

const reserveAtOnce = (product, clients) =>
  Promise.all(
    Array.from({ length: clients }, (_, i) =>
      api('POST', '/reservations', {
        phone: testPhone(100 + i),
        productId: product.id,
        size: product.sizes[0],
        quantity: 1,
        idempotencyKey: `wamid.TEST-CONC-${Date.now()}-${i}`,
      })
    )
  );

describe('Concurrencia: varios clientes y stock limitado', () => {
  let ctx;

  before(async () => {
    ctx = await pickProduct();
  });

  after(async () => {
    await cleanup(ctx);
    await prisma.$disconnect();
  });

  test('2 clientes, 1 unidad: exactamente uno se la queda', async () => {
    await prisma.product.update({ where: { id: ctx.product.id }, data: { inStock: 1, reserved: 0 } });

    const results = await reserveAtOnce(ctx.product, 2);
    const statuses = results.map((r) => r.status).sort();

    assert.deepEqual(statuses, [201, 409]);
    const product = await prisma.product.findUnique({ where: { id: ctx.product.id } });
    assert.equal(product.reserved, 1);
  });

  test('10 clientes, 1 unidad: 1 gana y 9 reciben agotado', async () => {
    await cleanup();
    await prisma.product.update({ where: { id: ctx.product.id }, data: { inStock: 1, reserved: 0 } });

    const results = await reserveAtOnce(ctx.product, 10);

    assert.equal(results.filter((r) => r.status === 201).length, 1);
    assert.equal(results.filter((r) => r.status === 409).length, 9);
    const product = await prisma.product.findUnique({ where: { id: ctx.product.id } });
    assert.equal(product.reserved, 1, 'nunca se aparta más de lo que hay');
  });

  test('10 clientes, 3 unidades: 3 ganan y nunca hay sobreventa', async () => {
    await cleanup();
    await prisma.product.update({ where: { id: ctx.product.id }, data: { inStock: 3, reserved: 0 } });

    const results = await reserveAtOnce(ctx.product, 10);

    assert.equal(results.filter((r) => r.status === 201).length, 3);
    const product = await prisma.product.findUnique({ where: { id: ctx.product.id } });
    assert.equal(product.reserved, 3);
    assert.ok(product.inStock - product.reserved >= 0);
  });
});
