import { createServer as httpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
  ['/decision.mjs', ['decision.mjs', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);

export function createServer() {
  return httpServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, type, body) => {
      response.writeHead(status, { 'Content-Type': type });
      response.end(body);
    };
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      return send(405, 'text/plain', 'GET only');
    }
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/api/quota') {
      const quotas = { normal: 100, exhausted: 0, missing: null };
      const scenario = url.searchParams.get('scenario') ?? 'normal';
      if (!Object.hasOwn(quotas, scenario)) return send(400, 'text/plain', 'Unknown scenario');
      return send(200, 'application/json', JSON.stringify({ remaining: quotas[scenario], defaultLimit: 100 }));
    }
    const file = files.get(url.pathname);
    if (!file) return send(404, 'text/plain', 'Not found');
    try {
      send(200, file[1], await readFile(new URL(`./public/${file[0]}`, import.meta.url)));
    } catch {
      send(500, 'text/plain', 'Fixture file unavailable');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(4173, '127.0.0.1', () => console.log('Reproduction Lab: http://127.0.0.1:4173'));
}
