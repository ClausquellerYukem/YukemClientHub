import express from 'express';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const defaultUpstream = process.env.UPSTREAM_URL || 'http://localhost:5000';
const port = process.env.GATEWAY_PORT ? parseInt(process.env.GATEWAY_PORT) : 8080;

const getEnv = (key: string, fallback?: string) => process.env[key] || fallback || '';
const parseIntSafe = (v: string | undefined, def: number) => {
  const n = v ? parseInt(v) : NaN;
  return Number.isFinite(n) ? n : def;
};

type RouteTarget = { prefix: string; upstream: string; canary?: string; weight?: number };
const targets: RouteTarget[] = [
  { prefix: '/api/cash', upstream: getEnv('CASH_UPSTREAM', defaultUpstream), canary: getEnv('CASH_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('CASH_CANARY_WEIGHT'), 0) },
  { prefix: '/api/invoices', upstream: getEnv('INVOICES_UPSTREAM', defaultUpstream), canary: getEnv('INVOICES_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('INVOICES_CANARY_WEIGHT'), 0) },
  { prefix: '/api/licenses', upstream: getEnv('LICENSES_UPSTREAM', defaultUpstream), canary: getEnv('LICENSES_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('LICENSES_CANARY_WEIGHT'), 0) },
  { prefix: '/api/boleto', upstream: getEnv('BOLETO_UPSTREAM', defaultUpstream), canary: getEnv('BOLETO_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('BOLETO_CANARY_WEIGHT'), 0) },
  { prefix: '/api/reports', upstream: getEnv('REPORTS_UPSTREAM', defaultUpstream), canary: getEnv('REPORTS_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('REPORTS_CANARY_WEIGHT'), 0) },
  { prefix: '/api/companies', upstream: getEnv('COMPANIES_UPSTREAM', defaultUpstream), canary: getEnv('COMPANIES_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('COMPANIES_CANARY_WEIGHT'), 0) },
  { prefix: '/api/permissions', upstream: getEnv('PERMISSIONS_UPSTREAM', defaultUpstream), canary: getEnv('PERMISSIONS_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('PERMISSIONS_CANARY_WEIGHT'), 0) },
  { prefix: '/api/user', upstream: getEnv('USER_UPSTREAM', defaultUpstream), canary: getEnv('USER_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('USER_CANARY_WEIGHT'), 0) },
  { prefix: '/api/users', upstream: getEnv('USERS_UPSTREAM', defaultUpstream), canary: getEnv('USERS_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('USERS_CANARY_WEIGHT'), 0) },
  { prefix: '/api/roles', upstream: getEnv('ROLES_UPSTREAM', defaultUpstream), canary: getEnv('ROLES_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('ROLES_CANARY_WEIGHT'), 0) },
  { prefix: '/api/admin', upstream: getEnv('ADMIN_UPSTREAM', defaultUpstream), canary: getEnv('ADMIN_CANARY_UPSTREAM'), weight: parseIntSafe(getEnv('ADMIN_CANARY_WEIGHT'), 0) },
];

const envFiles = (() => {
  const env = process.env.GATEWAY_ENV;
  const list: string[] = [];
  if (env) list.push(`.env.gateway.${env}`);
  list.push('.env.gateway.local', '.env.gateway', '.env.local', '.env');
  return list;
})();
for (const f of envFiles) {
  try {
    const p = path.resolve(process.cwd(), f);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const m = /^([A-Za-z_][A-Za-z0-9_]*?)=(.*)$/.exec(line.trim());
        if (!m) continue;
        const k = m[1];
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('\'') && v.endsWith('\''))) v = v.slice(1, -1);
        if (process.env[k] === undefined) process.env[k] = v;
      }
    }
  } catch {}
}

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.send('ok'));
app.get('/routes', (_req, res) => res.json({ defaultUpstream, routes: targets }));

const pickUpstream = (url: string) => {
  const t = targets.find(rt => url.startsWith(rt.prefix));
  if (!t) return { base: defaultUpstream, meta: { prefix: 'default', usedCanary: false } };
  if (t.canary && t.weight && t.weight > 0) {
    const r = Math.floor(Math.random() * 100);
    if (r < t.weight) return { base: t.canary, meta: { prefix: t.prefix, usedCanary: true } };
  }
  return { base: t.upstream || defaultUpstream, meta: { prefix: t.prefix, usedCanary: false } };
};

const logSampleRate = (() => {
  const v = process.env.LOG_SAMPLE_RATE ? parseInt(process.env.LOG_SAMPLE_RATE) : 1;
  return Number.isFinite(v) ? Math.min(Math.max(v, 0), 100) : 1;
})();

app.use(async (req: Request, res: Response) => {
  try {
    const choice = pickUpstream(req.originalUrl);
    const targetUrl = `${choice.base}${req.originalUrl}`;
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string') headers[k] = v;
    }
    delete headers['host'];
    const reqId = headers['x-request-id'] || randomUUID();
    headers['x-request-id'] = reqId;
    const init: any = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = req.body ? JSON.stringify(req.body) : undefined;
      if (!headers['content-type']) headers['content-type'] = 'application/json';
    }
    if (choice.meta.usedCanary) {
      const r = Math.floor(Math.random() * 100);
      if (r < logSampleRate) {
        console.log(JSON.stringify({ level: 'info', type: 'canary', prefix: choice.meta.prefix, url: req.originalUrl, target: choice.base, requestId: reqId }));
      }
    }
    const upstreamRes = await fetch(targetUrl, init);
    const text = await upstreamRes.text();
    res.status(upstreamRes.status);
    for (const [k, v] of upstreamRes.headers) {
      if (k.toLowerCase() === 'content-length') continue;
      res.setHeader(k, v);
    }
    res.setHeader('x-request-id', reqId);
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: 'Bad gateway' });
  }
});

app.listen(port, () => {
  console.log(`Gateway listening on ${port}, default upstream ${defaultUpstream}`);
});
