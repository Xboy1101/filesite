// Simple static file hosting site for Nodaroo (Node.js, no dependencies).
// Serves files from ./public and lists them on the index page.
// Nodara runs `node app.js` and sets PORT (default 8080).
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PUBLIC = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.apk': 'application/vnd.android.package-archive',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function fmtSize(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

function indexPage() {
  let files = [];
  try {
    files = fs.readdirSync(PUBLIC, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => {
        const st = fs.statSync(path.join(PUBLIC, d.name));
        return { name: d.name, size: st.size, mtime: st.mtime };
      })
      .sort((a, b) => b.mtime - a.mtime);
  } catch (e) { /* empty */ }
  const rows = files.map(f =>
    `<tr><td><a href="/${encodeURIComponent(f.name)}">${esc(f.name)}</a></td><td>${fmtSize(f.size)}</td><td>${f.mtime.toLocaleString('zh-CN')}</td></tr>`
  ).join('\n') || '<tr><td colspan="3">还没有文件，晚上把文件发我，我来传。</td></tr>';
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>文件站</title><style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;max-width:760px;margin:40px auto;padding:0 16px;color:#222}h1{font-size:22px}table{width:100%;border-collapse:collapse}td,th{padding:8px 6px;border-bottom:1px solid #e5e5e5;text-align:left;font-size:14px}a{color:#0969da;text-decoration:none}</style></head><body><h1>文件站</h1><table><tr><th>文件名</th><th>大小</th><th>修改时间</th></tr>${rows}</table></body></html>`;
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(indexPage());
    return;
  }
  const name = url.replace(/^\//, '');
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    res.writeHead(400); res.end('Bad request'); return;
  }
  const fp = path.join(PUBLIC, name);
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(name).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Content-Disposition': `inline; filename="${encodeURIComponent(name)}"`,
    });
    fs.createReadStream(fp).pipe(res);
  });
});

server.listen(PORT, () => console.log(`File site listening on ${PORT}`));
