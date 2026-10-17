import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, 'dist');

const PORT = Number(process.env.PORT) || 8082;
const HOST = '0.0.0.0';
const GATEWAY_HOST = '127.0.0.1';
const GATEWAY_PORT = 9119;
const GATEWAY_ORIGIN = ['http:', '', `${GATEWAY_HOST}:${GATEWAY_PORT}`].join('/');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json'
};

let cachedToken = '';
let tokenFetchedAt = 0;
const TOKEN_TTL = 5 * 60 * 1000;

async function fetchSessionToken() {
  const now = Date.now();
  if (cachedToken && (now - tokenFetchedAt) < TOKEN_TTL) {
    return cachedToken;
  }
  try {
    const res = await fetch(GATEWAY_ORIGIN + '/');
    if (res.ok) {
      const html = await res.text();
      const match = html.match(new RegExp('__HERMES_SESSION_TOKEN__\\s*=\\s*[\'"]([^\'"]+)[\'"]'));
      if (match && match[1]) {
        cachedToken = match[1];
        tokenFetchedAt = now;
        return cachedToken;
      }
    }
  } catch (err) {
  }
  return cachedToken;
}

async function loadSystemProviderKeys() {
  const keys = { bynara: '', openrouter: '', artbloom: '' };
  try {
    const yamlContent = await fs.promises.readFile('/opt/data/config.yaml', 'utf-8');
    const bynaraMatch = yamlContent.match(new RegExp('api_key:\\s*([^\\s\\r\\n]+)'));
    if (bynaraMatch) keys.bynara = bynaraMatch[1];
    const orMatch = yamlContent.match(new RegExp('openrouter:[\\s\\S]*?api_key:\\s*([^\\s\\r\\n]+)'));
    if (orMatch) keys.openrouter = orMatch[1];
    const abMatch = yamlContent.match(new RegExp('artbloom:[\\s\\S]*?api_key:\\s*([^\\s\\r\\n]+)'));
    if (abMatch) keys.artbloom = abMatch[1];
  } catch (e) {
  }
  if (!keys.artbloom) {
    try {
      const envContent = await fs.promises.readFile('/opt/data/.env', 'utf-8');
      const abEnvMatch = envContent.match(new RegExp('ARTBLOOM_API_KEY=([^\\s\\r\\n]+)'));
      if (abEnvMatch) keys.artbloom = abEnvMatch[1];
    } catch (e) {
    }
  }
  return keys;
}

async function serveIndexHtml(res, method) {
  const indexPath = path.join(DIST_DIR, 'index.html');
  try {
    let html = await fs.promises.readFile(indexPath, 'utf-8');
    const token = await fetchSessionToken();
    const systemKeys = await loadSystemProviderKeys();
    const script = `<script>window.__HERMES_SESSION_TOKEN__="${token}";window.__HERMES_AUTH_REQUIRED__=false;window.__HERMES_SYSTEM_KEYS__=${JSON.stringify(systemKeys)};</script>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${script}</head>`);
    } else {
      html = script + html;
    }
    const buf = Buffer.from(html, 'utf-8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': buf.length,
      'Cache-Control': 'no-cache'
    });
    if (method === 'HEAD') {
      res.end();
      return;
    }
    res.end(buf);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
}

function proxyHttpRequest(req, res) {
  const headers = { ...req.headers };
  headers.host = `${GATEWAY_HOST}:${GATEWAY_PORT}`;
  const proxyReq = http.request({
    hostname: GATEWAY_HOST,
    port: GATEWAY_PORT,
    path: req.url,
    method: req.method,
    headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Gateway');
    }
  });
  req.on('aborted', () => {
    proxyReq.destroy();
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      proxyReq.destroy();
    }
  });
  req.pipe(proxyReq);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || '/', GATEWAY_ORIGIN);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname.startsWith('/api/')) {
    proxyHttpRequest(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  let relativePath = pathname;
  if (relativePath.startsWith('/')) {
    relativePath = relativePath.slice(1);
  }
  const resolvedPath = path.resolve(DIST_DIR, relativePath);

  if (!resolvedPath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  let stat = null;
  try {
    stat = await fs.promises.stat(resolvedPath);
  } catch (err) {
    stat = null;
  }

  if (stat && stat.isFile()) {
    if (resolvedPath === path.join(DIST_DIR, 'index.html')) {
      await serveIndexHtml(res, req.method);
      return;
    }
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': contentType,
      'Content-Length': stat.size
    };
    if (pathname.startsWith('/assets/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache';
    }
    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    const stream = fs.createReadStream(resolvedPath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500);
      }
      res.end();
    });
    stream.pipe(res);
    return;
  }

  await serveIndexHtml(res, req.method);
});

server.on('upgrade', async (req, socket, head) => {
  const parsedUrl = new URL(req.url || '/', GATEWAY_ORIGIN);
  const pathname = parsedUrl.pathname;
  const isWs = pathname.startsWith('/api/ws') || req.headers.upgrade?.toLowerCase() === 'websocket';
  if (!isWs) {
    socket.destroy();
    return;
  }

  let token = await fetchSessionToken();
  let targetPath = req.url || '/api/ws';
  if (token && !targetPath.includes('token=')) {
    const sep = targetPath.includes('?') ? '&' : '?';
    targetPath = `${targetPath}${sep}token=${encodeURIComponent(token)}`;
  }

  const headers = {
    ...req.headers,
    host: `${GATEWAY_HOST}:${GATEWAY_PORT}`,
    origin: GATEWAY_ORIGIN,
    connection: 'Upgrade',
    upgrade: 'websocket'
  };

  const proxyReq = http.request({
    hostname: GATEWAY_HOST,
    port: GATEWAY_PORT,
    path: targetPath,
    method: 'GET',
    headers
  });

  const abort = () => {
    socket.destroy();
    proxyReq.destroy();
  };

  socket.on('error', abort);
  socket.on('close', abort);
  proxyReq.on('error', abort);

  proxyReq.on('response', () => {
    socket.destroy();
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.removeListener('error', abort);
    socket.removeListener('close', abort);

    let headersStr = 'HTTP/1.1 101 Switching Protocols\r\n';
    if (proxyRes.rawHeaders) {
      for (let i = 0; i < proxyRes.rawHeaders.length; i += 2) {
        headersStr += `${proxyRes.rawHeaders[i]}: ${proxyRes.rawHeaders[i + 1]}\r\n`;
      }
    } else {
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (Array.isArray(value)) {
          for (const v of value) {
            headersStr += `${key}: ${v}\r\n`;
          }
        } else if (value !== undefined) {
          headersStr += `${key}: ${value}\r\n`;
        }
      }
    }
    headersStr += '\r\n';

    socket.write(headersStr);

    if (proxyHead && proxyHead.length) {
      socket.write(proxyHead);
    }
    if (head && head.length) {
      proxySocket.write(head);
    }

    socket.pipe(proxySocket);
    proxySocket.pipe(socket);

    const cleanup = () => {
      socket.destroy();
      proxySocket.destroy();
    };

    socket.on('error', cleanup);
    proxySocket.on('error', cleanup);
    socket.on('close', cleanup);
    proxySocket.on('close', cleanup);
  });

  proxyReq.end();
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`Hermes web server listening on ${HOST}:${PORT}\n`);
});
