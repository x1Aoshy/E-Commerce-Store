const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const ts = require("typescript");

// Compilar los módulos reales a un directorio temporal permite probarlos con
// el runner nativo de Node sin agregar dependencias ni generar archivos fuente.
const output = mkdtempSync(path.join(tmpdir(), "store-currency-"));
for (const name of ["format", "invoice", "whatsapp", "csv"]) {
  const source = readFileSync(path.join(__dirname, `../src/lib/${name}.ts`), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  writeFileSync(path.join(output, `${name}.js`), compiled.outputText);
}
after(() => rmSync(output, { recursive: true, force: true }));

// La tasa de estas pruebas es fija e independiente del entorno de despliegue.
process.env.NEXT_PUBLIC_USD_EXCHANGE_RATE = "36.6243";
process.env.NEXT_PUBLIC_CURRENCY = "$";
const { formatPrice, normalizeCurrency, USD_EXCHANGE_RATE } = require(path.join(output, "format.js"));
const { buildInvoiceHtml } = require(path.join(output, "invoice.js"));
const { buildOrderMessage, buildWhatsAppUrl } = require(path.join(output, "whatsapp.js"));
const { buildOrdersCsv } = require(path.join(output, "csv.js"));

const order = {
  code: "TEST-001",
  createdAt: "2026-01-15T18:00:00Z",
  items: [{ name: "Proteína <especial>", price: 10, quantity: 2, subtotal: 20 }],
  total: 20,
  discount: 2,
  coupon: "AHORRO",
  extra: 1,
  extraLabel: "Entrega",
  status: "pendiente",
  customer: { name: "Cliente" },
};

test("un precio guardado de US$20 se convierte a C$732.49 por defecto", () => {
  assert.equal(formatPrice(20), "C$732.49");
  assert.equal(formatPrice(1), "C$36.62");
  assert.equal(normalizeCurrency("USD"), "USD");
  for (const invalid of [undefined, null, "usd", "EUR", "US$", "<script>"]) {
    assert.equal(normalizeCurrency(invalid), "NIO");
  }
});

test("la factura de un pedido anterior de US$20 muestra C$732.49 o US$20", () => {
  const previousOrder = {
    ...order,
    items: [{ name: "Producto existente", price: 20, quantity: 1, subtotal: 20 }],
    total: 20,
    discount: 0,
    extra: 0,
  };
  const nio = buildInvoiceHtml({ order: previousOrder });
  const usd = buildInvoiceHtml({ order: previousOrder, currency: "USD" });
  assert.ok(nio.includes("TOTAL</span><span>C$732.49</span>"));
  assert.ok(usd.includes("TOTAL</span><span>US$20.00</span>"));
  assert.equal(previousOrder.total, 20);
});

test("los dólares guardados conservan su valor al seleccionar USD", () => {
  assert.equal(USD_EXCHANGE_RATE, 36.6243);
  assert.equal(formatPrice(20, "USD"), "US$20.00");
  assert.equal(formatPrice(12.75, "USD"), "US$12.75");
  assert.equal(formatPrice(0, "USD"), "US$0.00");
  assert.equal(formatPrice(NaN), "C$0.00");
  assert.equal(formatPrice(Infinity), "C$0.00");
});

for (const [currency, line, discount, extra, total] of [
  ["NIO", "C$732.49", "C$73.25", "C$36.62", "C$695.86"],
  ["USD", "US$20.00", "US$2.00", "US$1.00", "US$19.00"],
]) {
  test(`factura, WhatsApp y CSV concuerdan en ${currency}, sin modificar el pedido`, () => {
    const original = structuredClone(order);
    const html = buildInvoiceHtml({ order, currency });
    for (const amount of [line, discount, extra, total]) assert.ok(html.includes(amount));
    assert.ok(html.includes(`TOTAL</span><span>${total}</span>`));
    assert.ok(html.includes("Proteína &lt;especial&gt;"));
    assert.ok(html.includes(currency === "USD" ? "Dólares (USD)" : "Córdobas (NIO)"));

    const message = buildOrderMessage(order, "Tienda", "", "", currency);
    assert.ok(message.includes(`Subtotal: ${line}`));
    assert.ok(message.includes(`Descuento (AHORRO): -${discount}`));
    assert.ok(message.includes(`Entrega: ${extra}`));
    assert.ok(message.includes(`*Total: ${total}*`));

    const csv = buildOrdersCsv([order], currency).replace(/^\uFEFF/, "").split("\r\n");
    const headers = csv[0].split(";");
    const values = csv[1].split(";");
    assert.equal(values[headers.indexOf("Moneda")], currency);
    assert.equal(values[headers.indexOf("Total")], currency === "USD" ? "19.00" : "695.86");
    assert.deepEqual(order, original);
  });
}

test("la factura predeterminada es NIO y una moneda inválida no inyecta HTML", () => {
  assert.ok(buildInvoiceHtml({ order }).includes("Córdobas (NIO)"));
  const html = buildInvoiceHtml({ order, currency: '<img src=x onerror="bad()">' });
  assert.ok(html.includes("Córdobas (NIO)"));
  assert.ok(!html.includes("bad()"));
});

test("el total nunca baja de cero y los cargos se suman tras el descuento", () => {
  const discounted = { ...order, discount: 1000 };
  assert.ok(buildInvoiceHtml({ order: discounted, currency: "USD" }).includes("TOTAL</span><span>US$1.00</span>"));
  assert.ok(buildOrderMessage(discounted, "", "", "", "USD").includes("*Total: US$1.00*"));
});

test("WhatsApp conserva la moneda elegida y el enlace del recibo", () => {
  const receiptUrl = "https://example.com/recibo/test?currency=USD";
  const url = new URL(buildWhatsAppUrl({
    phone: "+505 8888 8888", order, currency: "USD", receiptUrl,
  }));
  assert.equal(url.pathname, "/50588888888");
  assert.ok(url.searchParams.get("text").includes("*Total: US$19.00*"));
  assert.ok(url.searchParams.get("text").includes(receiptUrl));
});
