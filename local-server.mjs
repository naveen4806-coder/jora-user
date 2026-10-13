import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const port = Number(process.env.JORA_PORT || 4173);
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  let path = normalize(join(root, url.pathname === '/' ? 'legacy/opening.html' : url.pathname.replace(/^\/+/, '')));
  if (!path.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  if (!existsSync(path)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': `${types[extname(path).toLowerCase()] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' });
  createReadStream(path).pipe(res);
}).listen(port, () => console.log(`Jora preview: http://localhost:${port}/legacy/home.html`));
