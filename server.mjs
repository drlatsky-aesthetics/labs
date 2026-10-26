/**
 * Local server
 * ============
 *   npm start            → http://localhost:3000
 *
 * Serves public/ and routes /api/requisition to the same handler Vercel runs.
 * No framework, no database, nothing written to disk.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './api/requisition.js';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

function shim(res) {
  res.status = code => { res.statusCode = code; return res; };
  res.json = obj => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
  res.send = body => { res.end(body); return res; };
  return res;
}

const readBody = req => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === '/api/requisition') {
      req.body = req.method === 'POST' ? await readBody(req) : undefined;
      return await handler(req, shim(res));
    }
    const rel = url.pathname === '/' ? '/index.html' : url.pathname;
    const path = normalize(join(HERE, 'public', rel));
    if (!path.startsWith(join(HERE, 'public'))) { res.writeHead(403); return res.end(); }
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}).listen(PORT, () => console.log(`Lab requisitions → http://localhost:${PORT}`));
