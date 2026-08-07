import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import {
  collections,
  singletons,
  type CollectionName,
  type SingletonName,
} from './collections';

/**
 * mock-api — the fake backend behind the mockups.
 *
 * It serves exactly the fixtures in @mockups/mock-data, so a screen can be
 * built against `fetch('/api/products')` instead of a static import. That
 * matters once you want to demo loading states, empty states, pagination or
 * an error path — none of which an imported array can show you.
 *
 *   bun dev                          # http://localhost:8787
 *   curl localhost:8787/api/products?q=maggi&limit=5
 *   curl 'localhost:8787/api/products?delay=1500'   # watch your spinner
 *   curl 'localhost:8787/api/products?fail=500'     # watch your error state
 *
 * Nothing is persisted. Writes are accepted and echoed back so optimistic UI
 * has something to talk to, but a restart forgets everything — that is the
 * point, every demo starts from the same known state.
 */

const PORT = Number(process.env.PORT) || 8787;

const app = new Hono();

app.use('*', logger());
// Wide open on purpose: this only ever serves fixtures, and every mockup runs
// on a different localhost port.
app.use('*', cors());

/** ?delay=800 → sleep 800ms. ?fail=503 → return that status instead. */
app.use('/api/*', async (c, next) => {
  const delay = Number(c.req.query('delay') ?? 0);
  if (delay > 0) await Bun.sleep(Math.min(delay, 10_000));

  const fail = Number(c.req.query('fail') ?? 0);
  if (fail >= 400 && fail <= 599) {
    return c.json({ error: 'Simulated failure', status: fail }, fail as never);
  }
  await next();
});

// ── discovery ────────────────────────────────────────────────────────────────

app.get('/', (c) =>
  c.json({
    name: 'mockups-lab mock-api',
    hint: 'Append ?delay=<ms> to any /api route to simulate latency, ?fail=<status> to simulate an error.',
    collections: Object.keys(collections).map((k) => `/api/${k}`),
    singletons: Object.keys(singletons).map((k) => `/api/singletons/${k}`),
  })
);

app.get('/health', (c) => c.json({ ok: true, uptime: process.uptime() }));

// ── singletons ───────────────────────────────────────────────────────────────

app.get('/api/singletons/:name', (c) => {
  const name = c.req.param('name') as SingletonName;
  if (!(name in singletons)) return c.json({ error: `Unknown singleton '${name}'` }, 404);
  return c.json(singletons[name]);
});

// ── collections ──────────────────────────────────────────────────────────────

app.get('/api/:collection', (c) => {
  const name = c.req.param('collection') as CollectionName;
  const rows = collections[name];
  if (!rows) return c.json({ error: `Unknown collection '${name}'` }, 404);

  const q = c.req.query('q')?.toLowerCase();
  const filtered = q
    ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
    : rows;

  const offset = Number(c.req.query('offset') ?? 0);
  const limit = Number(c.req.query('limit') ?? filtered.length);

  return c.json({
    total: filtered.length,
    offset,
    limit,
    items: filtered.slice(offset, offset + limit),
  });
});

app.get('/api/:collection/:id', (c) => {
  const name = c.req.param('collection') as CollectionName;
  const rows = collections[name];
  if (!rows) return c.json({ error: `Unknown collection '${name}'` }, 404);

  const id = c.req.param('id');
  const hit = rows.find((row) => String((row as { id?: unknown })?.id) === id);
  if (!hit) return c.json({ error: `No ${name} with id '${id}'` }, 404);
  return c.json(hit);
});

/**
 * Accept-and-echo. Lets a mockup POST an order or PATCH a cart and get a
 * plausible response, without pretending to be a real service.
 */
app.on(['POST', 'PUT', 'PATCH'], '/api/:collection/*', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return c.json({ ok: true, echoed: body, at: new Date().toISOString() }, 201);
});

app.notFound((c) => c.json({ error: 'Not found', path: c.req.path }, 404));

console.log(`🧪 mock-api listening on http://localhost:${PORT}`);

export default { port: PORT, fetch: app.fetch };
