const { readFileSync, existsSync } = require('fs');
const { join, extname } = require('path');

const DIST = join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json',
};

module.exports = (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  // Servir assets estáticos (JS, CSS, imágenes, etc.)
  const ext = extname(pathname);
  if (ext && ext !== '.html') {
    const filePath = join(DIST, pathname);
    if (existsSync(filePath)) {
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.end(readFileSync(filePath));
      return;
    }
  }

  // Buscar el HTML de la ruta
  const base = pathname.replace(/\/$/, '');
  let htmlPath = join(DIST, base + '.html');
  if (!existsSync(htmlPath)) htmlPath = join(DIST, base, 'index.html');
  if (!existsSync(htmlPath)) htmlPath = join(DIST, 'index.html');

  if (existsSync(htmlPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(readFileSync(htmlPath));
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
};
